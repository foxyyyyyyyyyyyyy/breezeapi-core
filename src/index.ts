// Import stuff  from core
import { Server } from '@core/server.js';
import { ApiRouter } from '@core/api-router.js';
import { PageRouter } from '@core/page-router.js';
import { generateOpenAPIDocument } from '@core/openapi.js';
import { swaggerHtml } from '@core/swagger-ui.js';
import { WebSocketRouter } from '@core/ws-router';
export { WebSocketRouter } from '@core/ws-router';
export { Config } from '@core/config';
export { setCookie, getCookie, deleteCookie } from '@core/cookies';

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
import { HttpRequest } from './core/request';
import { HttpResponse } from './core/response';
import { errorResponse } from './utils/error';
function getCORSHeaders(
    corsOptions: Required<NonNullable<ServerOptions['cors']>>,
    req: apiRequest,
    alwaysAllowedHeaders: string[] = []
): Headers {
    const headers = new Headers();
    // Compute allowed origin
    let allowOrigin = Array.isArray(corsOptions.origin)
        ? corsOptions.origin.join(', ')
        : (corsOptions.origin === true ? '*' : corsOptions.origin);
    if (corsOptions.credentials && (allowOrigin === '*' || !allowOrigin)) {
        const reqOrigin = req.headers.get('origin');
        if (reqOrigin) allowOrigin = reqOrigin;
    }
    headers.set('Access-Control-Allow-Origin', allowOrigin || '*');
    headers.set(
        'Access-Control-Allow-Methods',
        Array.isArray(corsOptions.methods)
            ? corsOptions.methods.join(', ')
            : corsOptions.methods
    );

    // Compose allowed headers, always including alwaysAllowedHeaders
    let allowedHeaders = Array.isArray(corsOptions.allowedHeaders)
        ? corsOptions.allowedHeaders.join(', ')
        : corsOptions.allowedHeaders;
    // Merge with alwaysAllowedHeaders, deduplicated
    const allowedSet = new Set(
        (allowedHeaders ? allowedHeaders.split(',').map(h => h.trim()) : [])
            .concat(alwaysAllowedHeaders)
            .filter(Boolean)
    );
    headers.set(
        'Access-Control-Allow-Headers',
        Array.from(allowedSet).join(', ')
    );

    if (corsOptions.exposedHeaders)
        headers.set(
            'Access-Control-Expose-Headers',
            Array.isArray(corsOptions.exposedHeaders)
                ? corsOptions.exposedHeaders.join(', ')
                : corsOptions.exposedHeaders
        );
    if (corsOptions.credentials)
        headers.set('Access-Control-Allow-Credentials', 'true');
    if (corsOptions.maxAge)
        headers.set('Access-Control-Max-Age', String(corsOptions.maxAge));
    return headers;
}

export class BreezeAPI {
    private server: Server;
    private apiRouter?: ApiRouter;
    private pageRouter?: PageRouter;
    private globalMiddleware: Middleware[] = [];
    private wsRouter?: WebSocketRouter;
    private corsOptions: Required<NonNullable<ServerOptions['cors']>>;
    private alwaysAllowedHeaders: string[];

    /**
     * Constructor for the API class.
     * @param options - The options for the server and router.
     * The options object should contain the following properties:
     * - port: The port number to listen on.
     * - apiDir: The directory path to load API routes from.
     * - pageDir: The directory path to load page routes from.
     * - middleware: An array of global middleware functions.
     * - sseCors: (optional) CORS config for SSE routes only.
     * - alwaysAllowedHeaders: (optional) Array of headers always allowed in CORS (default: ['api-key'])
     */
    constructor(
        private options: ServerOptions & {
            sseCors?: { origin?: string; methods?: string; headers?: string; credentials?: boolean },
            alwaysAllowedHeaders?: string[]
        }
    ) {
        this.corsOptions = {
            origin: '*',
            methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
            allowedHeaders: 'Content-Type, Authorization',
            exposedHeaders: '',
            credentials: true,
            maxAge: 86400,
            ...(options.cors || {}),
        };
        this.alwaysAllowedHeaders = options.alwaysAllowedHeaders ?? ['api-key'];

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
       * Internal method to wrap a handler with CORS logic.
       * The handler now accepts apiRequest and apiResponse.
       */
    private _wrapWithCORS(handler: (req: apiRequest, res: apiResponse) => Promise<Response>): (request: Request) => Promise<Response> {
        // Accept the raw Bun Request
        return async (request: Request) => {

            // Create apiRequest and apiResponse here using the raw Bun Request
            const apiRequest = new HttpRequest(request) as any as apiRequest;
            const apiResponse = new HttpResponse() as any as apiResponse;

            // Handle preflight OPTIONS using apiRequest
            if (apiRequest.method === 'OPTIONS') {
                const corsHeaders = getCORSHeaders(this.corsOptions, apiRequest, this.alwaysAllowedHeaders);
                return new Response('OK', { status: 204, headers: corsHeaders });
            }

            // Call the real handler (the one returned by _createApiHandler).
            // Pass the *apiRequest* and *apiResponse* instances.
            const response = await handler(apiRequest, apiResponse);

            // Get CORS headers using the apiRequest
            const corsHeaders = getCORSHeaders(this.corsOptions, apiRequest, this.alwaysAllowedHeaders);

            // Directly modify the headers of the response returned by the handler.
            corsHeaders.forEach((v, k) => {
                // Use .set() to add or overwrite CORS headers
                response.headers.set(k, v);
            });

            // Return the response object whose headers you have just modified.
            return response;
        };
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
        const routes: { [key: string]: HTMLBundle | RequestHandler } = {};

        const rawApiHandler = this._createApiHandler();

        // Wrap that raw handler with CORS logic
        const wrappedApiHandler = this._wrapWithCORS(rawApiHandler);
        // Handle page routes
        if (this.pageRouter) {
            await this.pageRouter.loadPages();
            if (this.pageRouter.pages.length > 0) {
                this.pageRouter.pages.forEach((page) => {
                    routes[page.path] = page.handler;
                });
            }
        }

        // If both WebSocket and API routers are present
        if (this.wsRouter && this.apiRouter) {
            await this.wsRouter.loadRoutes();
            await this.apiRouter.loadRoutes();

            this.server.startSocket(
                routes,
                wrappedApiHandler,
                this.wsRouter,
                port,
                cb
            );
        } else if (this.apiRouter) {
            await this.apiRouter.loadRoutes();
            this.server.start(
                routes,
                wrappedApiHandler,
                port,
                cb
            );
        } else {
            const defaultHandler = async (request: Request) => {
                const apiRequest = new HttpRequest(request) as any as apiRequest;
                const apiResponse = new HttpResponse() as any as apiResponse;
                return apiResponse.status(200).json({ message: 'Hello from BreezeAPI!' });
            };
            const wrappedDefaultHandler = this._wrapWithCORS(defaultHandler);

            this.server.start(
                undefined,
                wrappedDefaultHandler, // Pass the wrapped handler
                port,
                cb
            );
        }

    }

    /**
     * Internal method to create the API handler for both HTTP and WebSocket servers.
     */
    /**
  * Internal method to create the API handler for both HTTP and WebSocket servers.
  */
    private _createApiHandler(): (req: apiRequest, res: apiResponse) => Promise<Response> {

        // This function now returns the actual fetch handler for Bun.serve
        return async (apiRequest: apiRequest, apiResponse: apiResponse) => {

            try {
                // If no API router, fallback to 404
                if (!this.apiRouter) {
                    return apiResponse.status(404).json({ error: 'API Router not configured' });
                }

                const url = new URL(apiRequest.url); // Use apiRequest.url

                // Check if the request is for /openapi.json
                if (url.pathname === '/openapi.json') {
                    const doc = generateOpenAPIDocument(this.apiRouter, this.options);
                    return apiResponse.json(doc);
                }

                // Serve the Swagger UI at /docs
                if (url.pathname === '/docs') {
                    return apiResponse.html(swaggerHtml); // Assuming res.html exists
                }

                // Get the route and params for the current request
                // Pass apiRequest to your resolve method
                const { route, params } = this.apiRouter.resolve(apiRequest);

                if (!route) {
                    return apiResponse.status(404).json({ error: 'Route not found' });
                }

                // Assign params to apiRequest
                apiRequest.params = params;

                // Get the handler for the current HTTP method
                const method = apiRequest.method.toUpperCase(); // Use apiRequest.method
                let handler = route.handlers[method];

                // --- SSE Support ---
                const isSSE =
                    method === 'GET' &&
                    (typeof route.handlers.SSE === 'function' || typeof route.handlers.sse === 'function');
                const sseHandler = isSSE
                    ? (route.handlers.SSE || route.handlers.sse)
                    : undefined;

                if (isSSE && !handler && sseHandler) {
                    handler = sseHandler;
                }

                if (!handler) {
                    return apiResponse.status(405).json({ error: 'Method Not Allowed' });
                }

                /**
                 * Build the middleware composition chain.
                 * 1. Compose the Route-Specific Chain
                 * 2. Insert Validation Middleware (if a schema exists)
                 * 3. Insert Global Middleware
                 * 4. Execute the handler
                 */

                // 1. Compose the Route-Specific Chain
                const methodKey = apiRequest.method.toLowerCase(); // Use apiRequest.method
                let methodMiddleware: Middleware[] = [];

                if (route.config && route.config[methodKey] && Array.isArray(route.config[methodKey].middleware)) {
                    methodMiddleware = route.config[methodKey].middleware;
                } else if (route.config && Array.isArray(route.config.middleware)) {
                    methodMiddleware = route.config.middleware;
                } else if (route.middleware && Array.isArray(route.middleware)) {
                    methodMiddleware = route.middleware;
                }

                // Compose the handler chain
                let routeChain = async (): Promise<Response> => {
                    // If this is an SSE route, handle SSE after all middleware
                    if (isSSE && sseHandler) {
                        await this._handleSSE(sseHandler, apiRequest, apiResponse); // Pass apiRequest and apiResponse
                        // _handleSSE should likely handle the SSE response directly,
                        // so this dummy Response is just to satisfy the async return type.
                        // If _handleSSE returns a Response, use that.
                        return new Response(null, { status: 200 });
                    }
                    // Otherwise, normal handler
                    return handler(apiRequest, apiResponse); // Pass apiRequest and apiResponse
                };

                if (methodMiddleware.length > 0) {
                    for (const mw of methodMiddleware.slice().reverse()) {
                        const next: apiNext = routeChain;
                        routeChain = async () => mw(apiRequest, apiResponse, next); // Pass apiRequest and apiResponse
                    }
                }

                // 2. Insert Validation Middleware (if a schema exists)
                let composedChain = routeChain;
                if (route.schema) {
                    // Assuming createValidationMiddleware returns a middleware function that takes (req, res, next)
                    const validationMw = createValidationMiddleware(route.schema);
                    composedChain = async () => validationMw(apiRequest, apiResponse, routeChain); // Pass apiRequest and apiResponse
                }

                // 3. Wrap Global Middleware (in reverse order so that the first-added runs first)
                let finalHandler = composedChain;
                if (this.globalMiddleware.length > 0) {
                    for (const mw of this.globalMiddleware.slice().reverse()) {
                        const next: apiNext = finalHandler;
                        finalHandler = async () => mw(apiRequest, apiResponse, next); // Pass apiRequest and apiResponse
                    }
                }

                // Execute the full chain
                const finalResponse = await finalHandler();

                // Bun will look at the original request object (wrapped by apiRequest)
                // for cookies when returning the response from the main fetch handler.
                return finalResponse;


            } catch (error) {
                // Handle errors that occurred during middleware/handler execution
                return errorResponse(
                    error,
                    apiRequest.original, // Pass the original Bun request for logging/debugging context
                    this.options.debug ?? false
                );
            }
        };
    }


    /**
     * Handles Server-Sent Events (SSE) for GET requests with an SSE handler.
     * The SSE handler should return a ReadableStream or use the provided send function.
     * @param handler - The SSE handler function.
     * @param req - The API request.
     * @param res - The API response.
     */
    private async _handleSSE(handler: RequestHandler, req: apiRequest, res: apiResponse) {
        // Set SSE headers using .header()
        res.header('Content-Type', 'text/event-stream');
        res.header('Cache-Control', 'no-cache');
        res.header('Connection', 'keep-alive');

        // --- SSE-specific CORS support ---
        const sseCors = this.options.sseCors;
        if (sseCors) {
            res.header('Access-Control-Allow-Origin', sseCors.origin ?? '*');
            if (sseCors.methods) res.header('Access-Control-Allow-Methods', sseCors.methods);
            if (sseCors.headers) res.header('Access-Control-Allow-Headers', sseCors.headers);
            if (typeof sseCors.credentials === 'boolean') res.header('Access-Control-Allow-Credentials', String(sseCors.credentials));
        } else {
            res.header('Access-Control-Allow-Origin', '*');
        }

        let closed = false;

        // Provide a simple send function for convenience
        const send = (data: any, event?: string) => {
            if (closed) return;
            let payload = '';
            if (event) payload += `event: ${event}\n`;
            payload += `data: ${typeof data === 'string' ? data : JSON.stringify(data)}\n\n`;
            res.send(payload, false); // false = do not close connection
        };

        // Handler signature: (req, res, send?) or returns a ReadableStream
        // Only pass send if handler expects it (fixes TS2554)
        let maybeStream: any;
        if (handler.length === 3) {
            maybeStream = await (handler as any)(req, res, send);
        } else {
            maybeStream = await handler(req, res);
        }

        // If handler returned a ReadableStream, pipe it as SSE
        if (
            maybeStream &&
            typeof maybeStream === 'object' &&
            typeof maybeStream.getReader === 'function'
        ) {
            const stream = maybeStream as ReadableStream;
            const reader = stream.getReader();
            const pump = async () => {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    // Assume value is already a string or Uint8Array
                    res.send(typeof value === 'string' ? value : new TextDecoder().decode(value), false);
                }
                res.send('', true); // close connection
            };
            pump().catch(() => res.send('', true));
        } else {
            // If handler used send, keep connection open until closed by client
            if (typeof req.on === 'function') {
                req.on('close', () => {
                    closed = true;
                    res.send('', true); // close connection
                });
            }
        }
        // Always return a dummy Response to satisfy the type
        return new Response(null, { status: 200 });
    }

    /**
     * Register global middleware (like Express).
     * @param mw - The middleware function to add.
     */
    use(mw: Middleware) {
        this.addGlobalMiddleware(mw);
        return this;
    }

    private static configs: Map<string, any> = new Map();

    /**
     * Register or retrieve a global config for plugins/middleware.
     * @param keyOrConfig - A string key or a config object with a unique key property.
     * @param value - The config value (if using string key).
     */
    static config<T = any>(keyOrConfig: string | { key: string; value: T }, value?: T): void | T {
        if (typeof keyOrConfig === 'string') {
            if (typeof value !== 'undefined') {
                BreezeAPI.configs.set(keyOrConfig, value);
            }
            return BreezeAPI.configs.get(keyOrConfig);
        } else {
            BreezeAPI.configs.set(keyOrConfig.key, keyOrConfig.value);
        }
    }
}

/**
 * @deprecated Use BreezeAPI instead. This class will be removed in a future version.
 */
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
