// Import stuff from node
import { readdir } from 'fs/promises';
import * as path from 'path';

// Import utils
import {
    cleanPrefix,
    normalizePath,
    ROUTE_CONSTANTS,
    HTTP_METHODS,
} from '@utils';

// Import types
import type {
    ConfigurableMiddleware,
    GuardDefinition,
    Middleware,
    MiddlewareDefinition,
    RequestHandler,
    RouteDefinition,
    TrieNode,
} from '@Types';

/**
 * ApiRouter class for handling file-based routing.
 * Loads routes from a directory structure and matches requests to the appropriate route handlers.
 * Supports dynamic segments (e.g., [id]) and HTTP method handlers.
 * Routes are sorted to prioritize static routes over dynamic ones to prevent overlapping route issues.
 */
export class ApiRouter {
    /** The root of the trie where all routes will begin*/
    private root: TrieNode = { children: new Map() };

    /**
     * Constructor for the ApiRouter class.
     * @param routesDir The directory path where route modules are located.
     * @param prefix Optional prefix to prepend to all routes (e.g., "api" becomes "/api/...").
     * @throws {Error} If the routes directory path is not provided.
     */
    constructor(private routesDir: string, private prefix: string = '') {
        if (!routesDir) {
            throw new Error('Routes directory path is required');
        }
    }

    /**
     * Getter for the routes trie.
     * @returns The root of the trie.
     */
    get routes() {
        return this.root;
    }

    /**
     * Loads all routes from the routes directory into the trie structure.
     * @returns {Promise<void>} A promise that resolves when all routes are loaded.
     * @throws {Error} If the routes directory is not found or if an error occurs during route loading.
     */
    public async loadRoutes(): Promise<void> {
        try {
            await this.scanDirectory(this.routesDir);
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to load routes: ${errorMessage}`);
        }
    }

    /**
     * Inserts a route definition into the trie structure.
     * @param routeDef The route definition to insert, containing path, handlers, middleware, schema, and OpenAPI metadata.
     * @throws {Error} If the route definition is invalid or causes a conflict in the trie.
     */
    private insertRoute(routeDef: RouteDefinition) {
        let node = this.root;
        const segments = routeDef.path.split('/').filter(Boolean);
        for (const segment of segments) {
            if (segment.startsWith(':')) {
                if (!node.paramChild) {
                    node.paramChild = { children: new Map() };
                }
                node = node.paramChild;
                node.paramName = segment.slice(1);
            } else {
                if (!node.children.has(segment)) {
                    node.children.set(segment, { children: new Map() });
                }
                node = node.children.get(segment)!;
            }
        }
        node.route = routeDef;
    }

    /**
     * Recursively scans a directory for route modules (route.ts files) and loads them into the trie.
     * @param dir The current directory path to scan.
     * @param basePath The base path used to construct route paths from the directory structure.
     * @returns {Promise<void>} A promise that resolves when the directory scan is complete.
     * @throws {Error} If multiple dynamic folders are found at the same level or if directory access fails.
     */
    private async scanDirectory(
        dir: string,
        basePath: string = ''
    ): Promise<void> {
        // Track if a dynamic folder has been found at this directory level
        let dynamicFolderFound = false;

        try {
            const entries = await readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const entryPath = path.join(dir, entry.name);
                const relativePath = path.join(basePath, entry.name);

                if (entry.isDirectory()) {
                    // Handle dynamic directories (e.g., [id])
                    if (
                        entry.name.startsWith(
                            ROUTE_CONSTANTS.DYNAMIC_FOLDER_START
                        ) &&
                        entry.name.endsWith(ROUTE_CONSTANTS.DYNAMIC_FOLDER_END)
                    ) {
                        if (dynamicFolderFound) {
                            throw new Error(
                                `Multiple dynamic route folders found in the same directory: '${entry.name}' conflicts with another dynamic folder in '${dir}'.`
                            );
                        }
                        dynamicFolderFound = true;
                    }
                    await this.scanDirectory(entryPath, relativePath);
                } else if (entry.isFile() && entry.name === 'route.ts') {
                    await this.loadRouteModule(entryPath, relativePath);
                }
            }
        } catch (error) {
            if (error instanceof Error) {
                throw error; // Re-throw specific errors we created
            }
            throw new Error(
                `Failed to scan directory '${dir}': ${String(error)}`
            );
        }
    }

    /**
     * Loads a route module from a file and inserts it into the trie.
     * @param entryPath The full file system path to the route module (route.ts).
     * @param relativePath The relative path used to construct the route path.
     * @returns {Promise<void>} A promise that resolves when the module is loaded and inserted.
     * @throws {Error} If the route module fails to load or is invalid.
     */
        private async loadRouteModule(
        entryPath: string,
        relativePath: string
    ): Promise<void> {
        try {
            const routePath = this.convertFilePathToRoute(relativePath);
            console.info('Loading route:', routePath);
            const modulePath = path.resolve(entryPath);
            const routeModule = await import(modulePath);
    
            const handlers: { [method: string]: RequestHandler } = {};
            for (const method of HTTP_METHODS) {
                if (typeof routeModule[method] === 'function') {
                    handlers[method] = routeModule[method];
                }
            }
    
            // Process route configuration
            const routeConfig = routeModule.config || {};
            
            // Process middleware
            let middlewareArray: Middleware[] = [];
            
            // Add middleware from the middleware array (legacy support)
            if (Array.isArray(routeModule.middleware)) {
                middlewareArray = [...routeModule.middleware];
            }
            
            // Add middleware from route config
            if (routeConfig.middleware) {
                const configMiddleware = this.processMiddlewareConfig(routeConfig.middleware);
                middlewareArray = [...middlewareArray, ...configMiddleware];
            }
            
            // Process guards
            let guardsArray: Middleware[] = [];
            if (routeConfig.guards) {
                guardsArray = this.processGuardsConfig(routeConfig.guards);
            }
            
            // Combine guards and middleware (guards run first)
            const combinedMiddleware = [...guardsArray, ...middlewareArray];
    
            const routeDef: RouteDefinition = {
                path: routePath,
                handlers,
                middleware: combinedMiddleware,
                schema: routeModule.schema,
                openapi: routeModule.openapi,
                config: routeConfig,
            };
    
            this.insertRoute(routeDef);
        } catch (error) {
            throw new Error(
                `Failed to load route module '${entryPath}': ${String(error)}`
            );
        }
    }
    
    /**
     * Processes middleware configuration and returns an array of middleware functions
     * @param middlewareConfig The middleware configuration object or array
     * @returns An array of middleware functions
     */
    private processMiddlewareConfig(middlewareConfig: Middleware[] | Record<string, Middleware | MiddlewareDefinition>): Middleware[] {
        const middlewareArray: Middleware[] = [];
        
        if (Array.isArray(middlewareConfig)) {
            // If it's already an array, use it directly
            return middlewareConfig;
        }
        
        // Process object-style middleware config
        for (const [key, middleware] of Object.entries(middlewareConfig)) {
            if (typeof middleware === 'function') {
                // Simple middleware function
                middlewareArray.push(middleware as Middleware);
            } else if (typeof middleware === 'object' && middleware) {
                // Need to cast to MiddlewareDefinition to access properties safely
                const middlewareDef = middleware as MiddlewareDefinition;
                const handler = middlewareDef.handler;
                const config = middlewareDef.options || {};
                
                if (typeof handler === 'function') {
                    // Create a configured middleware function
                    const configuredMiddleware: Middleware = async (req, res, next) => {
                        // Pass the config to the middleware
                        return (handler as ConfigurableMiddleware)(req, res, next, config);
                    };
                    
                    middlewareArray.push(configuredMiddleware);
                }
            }
        }
        
        return middlewareArray;
    }
    
    /**
     * Processes guards configuration and returns an array of guard middleware functions
     * @param guardsConfig The guards configuration object or array
     * @returns An array of guard middleware functions
     */
    private processGuardsConfig(guardsConfig: Middleware[] | Record<string, Middleware | GuardDefinition>): Middleware[] {
        const guardsArray: Middleware[] = [];
        
        if (Array.isArray(guardsConfig)) {
            // If it's already an array, use it directly
            return guardsConfig;
        }
        
        // Process object-style guards config
        for (const [key, guard] of Object.entries(guardsConfig)) {
            if (typeof guard === 'function') {
                // Simple guard function
                guardsArray.push(guard as Middleware);
            } else if (typeof guard === 'object' && guard !== null) {
                // Need to cast to GuardDefinition to access properties safely
                const guardDef = guard as GuardDefinition;
                const handler = guardDef.handler;
                const config = guardDef.options || {};
                
                if (typeof handler === 'function') {
                    // Create a configured guard function
                    const configuredGuard: Middleware = async (req, res, next) => {
                        // Pass the config to the guard
                        return (handler as ConfigurableMiddleware)(req, res, next, config);
                    };
                    
                    guardsArray.push(configuredGuard);
                }
            }
        }
        
        return guardsArray;
    }

    /**
     * Converts a file path to a route path by processing dynamic segments and applying the prefix.
     * @param filePath The file path to convert (e.g., "users/[id]/route.ts").
     * @returns {string} The converted route path (e.g., "/users/:id").
     */
    private convertFilePathToRoute(filePath: string): string {
        // Remove the "route.ts" suffix
        if (filePath.endsWith('route.ts')) {
            filePath = filePath.slice(0, -'route.ts'.length);
        }

        // Split path into segments
        const segments = filePath.split(path.sep);
        const resultSegments: string[] = [];

        for (let segment of segments) {
            if (!segment) continue; // Skip empty segments

            // Skip grouping segments (e.g., (group))
            if (
                segment.startsWith(ROUTE_CONSTANTS.GROUPING_FOLDER_START) &&
                segment.endsWith(ROUTE_CONSTANTS.GROUPING_FOLDER_END)
            )
                continue;

            // Convert dynamic segments from [param] to :param
            if (
                segment.startsWith(ROUTE_CONSTANTS.DYNAMIC_FOLDER_START) &&
                segment.endsWith(ROUTE_CONSTANTS.DYNAMIC_FOLDER_END)
            ) {
                const param = segment.slice(1, -1);
                resultSegments.push(
                    ROUTE_CONSTANTS.DYNAMIC_SEGMENT_PREFIX + param
                );
            } else {
                resultSegments.push(segment);
            }
        }

        // Construct the route with leading slash
        let route = '/' + resultSegments.join('/');

        // Apply prefix if provided
        if (this.prefix) {
            const cleanPrefixStr = cleanPrefix(this.prefix);
            route = '/' + cleanPrefixStr + route;
        }

        // Remove trailing slash unless it's the root
        if (route !== '/' && route.endsWith('/')) {
            route = route.slice(0, -1);
        }

        return route;
    }

    /**
     * Resolves a request to a route definition and its parameters.
     * @param request The incoming HTTP request to resolve.
     * @returns {{ route?: RouteDefinition; params: Record<string, string> }} An object containing the matched route (if any) and extracted parameters.
     * @throws {Error} If the request URL is malformed.
     */
    public resolve(request: Request): {
        route?: RouteDefinition;
        params: Record<string, string>;
    } {
        try {
            const url = new URL(request.url);
            const reqPath = normalizePath(url.pathname);
            const method = request.method.toUpperCase();
            const segments = reqPath.split('/').filter(Boolean);

            let node = this.root;
            const params: Record<string, string> = {};

            for (const segment of segments) {
                if (node.children.has(segment)) {
                    node = node.children.get(segment)!;
                } else if (node.paramChild) {
                    node = node.paramChild;
                    params[node.paramName!] = segment;
                } else {
                    return { params: {} };
                }
            }

            if (node.route && node.route.handlers[method]) {
                return { route: node.route, params };
            }
            return { params: {} };
        } catch (error) {
            return { params: {} };
        }
    }
}
