// Import stuff  from core
import { Server } from '@core/server.js';
import { ApiRouter } from '@core/api-router.js';
import { PageRouter } from '@core/page-router.js';
import { generateOpenAPIDocument } from '@core/openapi.js';
import { swaggerHtml } from '@core/swagger-ui.js';
import { WebSocketRouter } from '@core/ws-router';
export { WebSocketRouter } from '@core/ws-router';

// Import middleware
import { createValidationMiddleware } from '@middleware/validator.js';

// Import types
import type {
    ServerOptions,
    Middleware,
    apiRequest,
    apiResponse,
    apiNext,
    RequestHandler,
} from '@Types';
import type { HTMLBundle } from 'bun';
import { initializeCronJobs } from '@core/cronjobs';

export class BreezeAPI {
    private server: Server;
    private apiRouter?: ApiRouter;
    private pageRouter?: PageRouter;
    private globalMiddleware: Middleware[] = [];
    private wsRouter?: WebSocketRouter;

    /**
     * Constructor for the API class.
     * @param options - The options for the server and router.
     * The options object should contain the following properties:
     * - port: The port number to listen on.
     * - apiDir: The directory path to load API routes from.
     * - pageDir: The directory path to load page routes from.
     * - middleware: An array of global middleware functions.
     */
    constructor(private options: ServerOptions) {
        this.server = new Server(options);
        // Initialize API router
        if (options.apiDir) {
            this.apiRouter = new ApiRouter(options.apiDir, '');
        }

        // Initialize page router
        if (options.pageDir) {
            this.pageRouter = new PageRouter(options.pageDir, 'pages');
        }

        // Initialize WebSocket router
        if (options.socketDir) {
            this.wsRouter = new WebSocketRouter(options.socketDir, 'socket'); 
        }


        // Add global middleware
        if (options.globalMiddleware) {
            options.globalMiddleware.forEach((mw) =>
                this.addGlobalMiddleware(mw)
            );
        }
    }

    /**
     * Adds a global middleware function to the list of middlewares.
     * @param mw - The middleware function to add.
     */
    addGlobalMiddleware(mw: Middleware) {
        this.globalMiddleware.push(mw);
    }

    /**
     * Starts the server and begins listening for incoming requests.
     * @param port - The port number to listen on. Defaults to `4000`.
     * @param cb - An optional cb function to be executed when the server is listening.
     * @returns A Promise that resolves when the server has started listening.
     */
    async serve(port: number = 4000, cb?: () => void): Promise<void> {
        // File-based routing mode
        const routes: { [key: string]: HTMLBundle | RequestHandler } = {};
        // Initialize cron jobs
        initializeCronJobs().catch((error) => {
            console.error('Failed to initialize cron jobs:', error);
        });
        // Handle page routes
        if (this.pageRouter) {
            // Load Page routes
            await this.pageRouter.loadPages();
            // If there are any page routes, add them to the routes object
            if (this.pageRouter.pages.length > 0) {
                this.pageRouter.pages.forEach((page) => {
                    routes[page.path] = page.handler;
                });
            }
        }
        if (this.wsRouter && this.apiRouter) {
            // Load WebSocket routes
            await this.wsRouter.loadRoutes();
            // Start the server
            // Load API routes
            await this.apiRouter.loadRoutes();
            // Start the server
            this.server.startSocket(
                routes,
                async (req: apiRequest, res: apiResponse) => {
                    // Create URL object
                    const url = new URL(req.url);

                    // Check if the request is for /openapi.json
                    if (url.pathname === '/openapi.json') {
                        if (this.apiRouter) {
                            // Generate OpenAPI document
                            const doc = generateOpenAPIDocument(
                                this.apiRouter,
                                this.options
                            );
                            // Return it as JSON
                            return res.json(doc);
                        } else {
                            // Return a descriptive error if router is not available
                            return res.status(500).json({
                                error: 'API Router not configured',
                                message:
                                    'Please provide an apiDir option when initializing the eSportsApp instance to enable OpenAPI documentation.',
                            });
                        }
                    }

                    // Serve the Swagger UI at /docs
                    if (url.pathname === '/docs') {
                        return res.html(swaggerHtml);
                    }

                    // Get the route and params for the current request
                    const { route, params } = this.apiRouter!.resolve(req);

                    if (!route) {
                        // Return a 404 if no route is found
                        return res
                            .status(404)
                            .json({ error: 'Route not found' });
                    }

                    // Add params to the request
                    req.params = params;

                    // Get the handler for the current HTTP method
                    const method = req.method.toUpperCase();
                    const handler = route.handlers[method];
                    if (!handler) {
                        // Return a 405 if no handler is found
                        return res
                            .status(405)
                            .json({ error: 'Method Not Allowed' });
                    }

                    /**
                     * Build the middleware composition chain.
                     * 1. Compose the Route-Specific Chain
                     * 2. Insert Validation Middleware (if a schema exists)
                     * 3. Insert Global Middleware
                     * 4. Execute the handler
                     */

                    // 1. Compose the Route-Specific Chain
                    let routeChain = async () => handler(req, res);
                    if (route.middleware && route.middleware.length > 0) {
                        // Wrap route-specific middleware (in reverse order to preserve order of execution)
                        for (const mw of route.middleware.slice().reverse()) {
                            const next: apiNext = routeChain;
                            routeChain = async () => mw(req, res, next);
                        }
                    }

                    // 2. Insert Validation Middleware (if a schema exists)
                    let composedChain = routeChain;
                    if (route.schema) {
                        const validationMw = createValidationMiddleware(
                            route.schema
                        );
                        composedChain = async () =>
                            validationMw(req, res, routeChain);
                    }

                    // 3. Wrap Global Middleware (in reverse order so that the first-added runs first)
                    let finalHandler = composedChain;
                    if (this.globalMiddleware.length > 0) {
                        for (const mw of this.globalMiddleware
                            .slice()
                            .reverse()) {
                            const next: apiNext = finalHandler;
                            finalHandler = async () => mw(req, res, next);
                        }
                    }

                    // Execute the full chain
                    return await finalHandler();
                },
                this.wsRouter,
                port,
                cb
            );
        } else if (this.apiRouter) {
            // Load API routes
            await this.apiRouter.loadRoutes();
            // Start the server
            this.server.start(
                routes,
                async (req: apiRequest, res: apiResponse) => {
                    // Create URL object
                    const url = new URL(req.url);

                    // Check if the request is for /openapi.json
                    if (url.pathname === '/openapi.json') {
                        if (this.apiRouter) {
                            // Generate OpenAPI document
                            const doc = generateOpenAPIDocument(
                                this.apiRouter,
                                this.options
                            );
                            // Return it as JSON
                            return res.json(doc);
                        } else {
                            // Return a descriptive error if router is not available
                            return res.status(500).json({
                                error: 'API Router not configured',
                                message:
                                    'Please provide an apiDir option when initializing the eSportsApp instance to enable OpenAPI documentation.',
                            });
                        }
                    }

                    // Serve the Swagger UI at /docs
                    if (url.pathname === '/docs') {
                        return res.html(swaggerHtml);
                    }

                    // Get the route and params for the current request
                    const { route, params } = this.apiRouter!.resolve(req);

                    if (!route) {
                        // Return a 404 if no route is found
                        return res
                            .status(404)
                            .json({ error: 'Route not found' });
                    }

                    // Add params to the request
                    req.params = params;

                    // Get the handler for the current HTTP method
                    const method = req.method.toUpperCase();
                    const handler = route.handlers[method];
                    if (!handler) {
                        // Return a 405 if no handler is found
                        return res
                            .status(405)
                            .json({ error: 'Method Not Allowed' });
                    }

                    /**
                     * Build the middleware composition chain.
                     * 1. Compose the Route-Specific Chain
                     * 2. Insert Validation Middleware (if a schema exists)
                     * 3. Insert Global Middleware
                     * 4. Execute the handler
                     */

                    // 1. Compose the Route-Specific Chain
                    let routeChain = async () => handler(req, res);
                    if (route.middleware && route.middleware.length > 0) {
                        // Wrap route-specific middleware (in reverse order to preserve order of execution)
                        for (const mw of route.middleware.slice().reverse()) {
                            const next: apiNext = routeChain;
                            routeChain = async () => mw(req, res, next);
                        }
                    }

                    // 2. Insert Validation Middleware (if a schema exists)
                    let composedChain = routeChain;
                    if (route.schema) {
                        const validationMw = createValidationMiddleware(
                            route.schema
                        );
                        composedChain = async () =>
                            validationMw(req, res, routeChain);
                    }

                    // 3. Wrap Global Middleware (in reverse order so that the first-added runs first)
                    let finalHandler = composedChain;
                    if (this.globalMiddleware.length > 0) {
                        for (const mw of this.globalMiddleware
                            .slice()
                            .reverse()) {
                            const next: apiNext = finalHandler;
                            finalHandler = async () => mw(req, res, next);
                        }
                    }

                    // Execute the full chain
                    return await finalHandler();
                },
                port,
                cb
            );
        } else {
            // Fallback to default handler if no router is provided
            this.server.start(
                undefined,
                async (_: apiRequest, res: apiResponse) => {
                    return res
                        .status(200)
                        .json({ message: 'Hello from eSportsApp-api!' });
                },
                port,
                cb
            );
        }
    }
}

// Deprecated: Use BreezeAPI instead.
export class API extends BreezeAPI {
    constructor(options: ServerOptions) {
        console.warn(
            '[DEPRECATED] The API class is deprecated since version 0.1.3. Please use BreezeAPI instead.'
        );
        super(options);
    }
}

// Export utils
export { setDir } from '@utils';

// Export types
export type {
    ServerOptions,
    RequestHandler,
    apiRequest,
    apiResponse,
    apiNext,
    Middleware,
    openapi,
    WebSocketData,
    WebSocketHandler,
    WebSocketRouteDefinition,
} from '@Types';
