// Import stuff from Bun
import { serve } from 'bun';
import { WebSocketRouter } from './ws-router';
// Import stuff from core
import { HttpRequest } from '@core/request.js';
import { HttpResponse } from '@core/response.js';

// Import stuff from utils
import { errorResponse } from '@utils/error.js';

import type {
    ServerOptions,
    RequestHandler,
    apiRequest,
    apiResponse,
    WebSocketData,
} from '@Types';

export class Server {
    private options: ServerOptions;
    private server: ReturnType<typeof serve> | null = null;

    /**
     * Initializes a new instance of the Server class with the given options.
     * @param options - Configuration options for the server.
     */
    constructor(options: ServerOptions) {
        this.options = options;
    }

    /**
     * Starts the server with the given routes, handler, port, and callback.
     * @param routes - The routes to be used by the server.
     * @param handler - The handler to be used by the server.
     * @param wsRouter The WebSocket router.
     * @param port - The port to listen on.
     * @param cb - An optional callback function to be called when the server starts.
     */
    public start(
        routes: { [key: string]: any } | undefined,
        handler: RequestHandler,
        port: number,
        cb?: () => void
    ): void {
        // Start Bun's native server using Bun.serve
        this.server = serve({
            routes,
            // eSportsApp's fetch handler
            fetch: async (request: Request) => {
                try {
                    // Handle CORS preflight requests
                    if (request.method === 'OPTIONS' && this.options.cors) {
                        return this.handleCorsPreflightRequest(request);
                    }

                    

                    // Handle favicon requests
                    if (
                        request.url.endsWith('/favicon.ico') &&
                        this.options.favicon
                    ) {
                        try {
                            // Read the favicon file
                            const icon = await Bun.file(
                                this.options.favicon
                            ).arrayBuffer();
                            const buffer = Buffer.from(icon);

                            // Create response with appropriate headers
                            return new Response(buffer, {
                                status: 200,
                                headers: {
                                    'Content-Type': 'image/x-icon',
                                    'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
                                    ETag: `W/"${buffer.length.toString(16)}"`,
                                },
                            });
                        } catch (error) {
                            console.error('Error serving favicon:', error);
                            return new Response(null, { status: 404 });
                        }
                    }

                    // Wrap the native Request with HttpRequest to get a apiRequest
                    const eSportsAppReq = new HttpRequest(
                        request
                    ) as unknown as apiRequest;

                    // Wrap the native Response with HttpResponse to get a apiResponse
                    const eSportsAppRes =
                        new HttpResponse() as unknown as apiResponse;

                    // Invoke and return the handler with the wrapped requests and responses
                    const response = await handler(
                        eSportsAppReq,
                        eSportsAppRes
                    );

                    // Add CORS headers to the response if configured
                    if (this.options.cors) {
                        return this.addCorsHeaders(response, request);
                    }

                    return response;
                } catch (error) {
                    // Return a custom error response
                    return errorResponse(
                        error,
                        request,
                        this.options.debug ?? false
                    );
                }
            },
            port,
        });
        if (cb) {
            cb();
        } else {
            console.log(`✔ Server started on port: ${port}`);
        }
    }

    private handleCorsPreflightRequest(request: Request): Response {
        const response = new Response(null, { status: 204 });
        return this.addCorsHeaders(response, request);
    }

    private addCorsHeaders(response: Response, request: Request): Response {
        const cors = this.options.cors;
        if (!cors) return response;

        const headers = new Headers(response.headers);

        // Handle Access-Control-Allow-Origin
        if (cors.origin) {
            if (cors.origin === true) {
                // Allow any origin when cors.origin is true
                const requestOrigin = request.headers.get('origin');
                headers.set(
                    'Access-Control-Allow-Origin',
                    requestOrigin || '*'
                );
            } else if (Array.isArray(cors.origin)) {
                const requestOrigin = request.headers.get('origin');
                if (requestOrigin && cors.origin.includes(requestOrigin)) {
                    headers.set('Access-Control-Allow-Origin', requestOrigin);
                } else {
                    headers.set('Access-Control-Allow-Origin', cors.origin[0]);
                }
            } else {
                headers.set('Access-Control-Allow-Origin', cors.origin);
            }
        }

        // Handle Access-Control-Allow-Methods
        if (cors.methods) {
            headers.set(
                'Access-Control-Allow-Methods',
                Array.isArray(cors.methods)
                    ? cors.methods.join(', ')
                    : cors.methods
            );
        }

        // Handle Access-Control-Allow-Headers
        if (cors.allowedHeaders) {
            headers.set(
                'Access-Control-Allow-Headers',
                Array.isArray(cors.allowedHeaders)
                    ? cors.allowedHeaders.join(', ')
                    : cors.allowedHeaders
            );
        }

        // Handle Access-Control-Expose-Headers
        if (cors.exposedHeaders) {
            headers.set(
                'Access-Control-Expose-Headers',
                Array.isArray(cors.exposedHeaders)
                    ? cors.exposedHeaders.join(', ')
                    : cors.exposedHeaders
            );
        }

        // Handle Access-Control-Allow-Credentials
        if (cors.credentials) {
            headers.set('Access-Control-Allow-Credentials', 'true');
        }

        // Handle Access-Control-Max-Age
        if (cors.maxAge !== undefined) {
            headers.set('Access-Control-Max-Age', cors.maxAge.toString());
        }

        headers.set('X-Powered-By', 'eSportsApp');

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers,
        });
    }

    /**
     * Stops the server.
     * If the server is currently running, this method will stop the server and
     * log a message to the console indicating that the server has been stopped.
     * If the server is not running, this method does nothing.
     */
    public stop(): void {
        if (this.server) {
            this.server.stop();
            console.log('Server stopped.');
        }
    }

    public startSocket<T extends WebSocketData>(
        routes: { [key: string]: any } | undefined,
        handler: RequestHandler,
        wsRouter: WebSocketRouter,
        port: number,
        cb?: () => void
    ): void {
        // Set the router globally so handlers can access it
        (global as any).wsRouter = wsRouter;

        // Start Bun's native server using Bun.serve
        this.server = Bun.serve({
            port,
            fetch: async (request: Request, server) => {
                try {
                    // Handle CORS preflight requests
                    if (request.method === 'OPTIONS' && this.options.cors) {
                        return this.handleCorsPreflightRequest(request);
                    }

                    if (this.options.config?.session) {
                        const sessionId = await generateSessionId();
                        server.upgrade(request, {
                            headers: {
                                'Set-Cookie': `SessionId=${sessionId}`,
                            },
                        });
                    }

                    // Handle favicon requests
                    if (
                        request.url.endsWith('/favicon.ico') &&
                        this.options.favicon
                    ) {
                        try {
                            // Read the favicon file
                            const icon = await Bun.file(
                                this.options.favicon
                            ).arrayBuffer();
                            const buffer = Buffer.from(icon);

                            // Create response with appropriate headers
                            return new Response(buffer, {
                                status: 200,
                                headers: {
                                    'Content-Type': 'image/x-icon',
                                    'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
                                    ETag: `W/"${buffer.length.toString(16)}"`,
                                },
                            });
                        } catch (error) {
                            console.error('Error serving favicon:', error);
                            return new Response(null, { status: 404 });
                        }
                    }

                    // Check if it's a WebSocket upgrade request
                    if (
                        request.headers.get('upgrade')?.toLowerCase() ===
                        'websocket'
                    ) {
                        const url = new URL(request.url);
                        console.log(
                            `WebSocket connection attempt: ${url.pathname}`
                        );
                        const { route, id } = wsRouter.matchRoute(url.pathname);

                        if (route) {
                            // Important: Use a consistent group path format
                            // For example, for chat rooms: /socket/chat/123
                            // NOT using the route.path, but the actual resolved path
                            const pathParts = url.pathname.split('/');
                            const routeParts = route.path.split('/');

                            // Group path should be the actual client path
                            const groupPath = url.pathname;

                            console.log(
                                `WebSocket connection to group: ${groupPath}, id: ${id}`
                            );

                            // Upgrade with data that will be available in the WebSocket handlers
                            server.upgrade(request, {
                                data: {
                                    id,
                                    groupPath,
                                    createdAt: Date.now(),
                                },
                            });
                            return undefined;
                        }

                        // No matching WebSocket route
                        console.log(
                            `No WebSocket route found for: ${url.pathname}`
                        );
                        return new Response('WebSocket not found', {
                            status: 404,
                        });
                    }

                    // Handle regular HTTP requests
                    const eSportsAppReq = new HttpRequest(
                        request
                    ) as unknown as apiRequest;

                    const eSportsAppRes =
                        new HttpResponse() as unknown as apiResponse;

                    const response = await handler(
                        eSportsAppReq,
                        eSportsAppRes
                    );

                    // Add CORS headers to the response if configured
                    if (this.options.cors) {
                        return this.addCorsHeaders(response, request);
                    }

                    return response;
                } catch (error) {
                    console.error('Error in fetch handler:', error);
                    // Return a custom error response
                    return errorResponse(
                        error,
                        request,
                        this.options.debug ?? false
                    );
                }
            },
            websocket: {
                open(ws: any) {
                    console.log(
                        `WebSocket opened for group: ${ws.data.groupPath}`
                    );
                    wsRouter.addToGroup(ws.data.groupPath, ws);

                    // Get the number of clients in this group
                    const clientCount = wsRouter.getGroupSockets(
                        ws.data.groupPath
                    ).size;
                    console.log(
                        `Group ${ws.data.groupPath} now has ${clientCount} connections`
                    );

                    // Match route based on the original pattern, not the group path
                    const { route } = wsRouter.matchRoute(ws.data.groupPath);
                    if (route?.handler.open) {
                        try {
                            route.handler.open(ws, ws.data.id);
                        } catch (error) {
                            console.error(`Error in open handler:`, error);
                        }
                    }
                },
                message(ws: any, message: any) {
                    console.log(
                        `Message received in group: ${ws.data.groupPath}`
                    );
                    const { route } = wsRouter.matchRoute(ws.data.groupPath);
                    if (route?.handler.message) {
                        try {
                            route.handler.message(ws, message, ws.data.id);
                        } catch (error) {
                            console.error(`Error in message handler:`, error);
                        }
                    }
                },
                close(ws: any, code: any, reason: any) {
                    console.log(
                        `WebSocket closed for group: ${ws.data.groupPath}`
                    );
                    wsRouter.removeFromGroup(ws.data.groupPath, ws);

                    // Get the number of clients remaining in this group
                    const clientCount = wsRouter.getGroupSockets(
                        ws.data.groupPath
                    ).size;
                    console.log(
                        `Group ${ws.data.groupPath} now has ${clientCount} connections`
                    );

                    const { route } = wsRouter.matchRoute(ws.data.groupPath);
                    if (route?.handler.close) {
                        try {
                            route.handler.close(ws, code, reason, ws.data.id);
                        } catch (error) {
                            console.error(`Error in close handler:`, error);
                        }
                    }
                },
                drain(ws: any) {
                    const { route } = wsRouter.matchRoute(ws.data.groupPath);
                    if (route?.handler.drain) {
                        try {
                            route.handler.drain(ws, ws.data.id);
                        } catch (error) {
                            console.error(`Error in drain handler:`, error);
                        }
                    }
                },
            },
        });

        if (cb) {
            cb();
        } else {
            console.log(
                `✔ Server started on port: ${port} with WebSocket support`
            );
        }
    }
}
function generateSessionId() {
    return crypto.randomUUID();
}
