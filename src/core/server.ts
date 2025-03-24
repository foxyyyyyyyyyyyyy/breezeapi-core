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
                    // Wrap the native Request with HttpRequest to get a apiRequest
                    const eSportsAppReq = new HttpRequest(
                        request
                    ) as unknown as apiRequest;

                    // Wrap the native Response with HttpResponse to get a apiResponse
                    const eSportsAppRes =
                        new HttpResponse() as unknown as apiResponse;
                    const res = new Response();
                    res.headers.set('X-Powered-By', 'eSportsApp');
                    // Invoke and return the handler with the wrapped requests and responses
                    return await handler(eSportsAppReq, eSportsAppRes);
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
    // Start Bun's native server using Bun.serve
    this.server = Bun.serve({
        port,
        fetch: async (request: Request, server) => {
            try {
                // Check if it's a WebSocket upgrade request
                if (request.headers.get('upgrade')?.toLowerCase() === 'websocket') {
                    const url = new URL(request.url);
                    const { route, id } = wsRouter.matchRoute(url.pathname);
                    
                    if (route) {
                        // Using Bun's server.upgrade approach
                        const groupPath = id ? `${route.path}/${id}` : route.path;
                        
                        // Upgrade the connection to WebSocket
                        server.upgrade(request, {
                            data: {
                                id,
                                groupPath,
                                createdAt: Date.now(),
                            } as T,
                        });
                        
                        // Return undefined to indicate the connection was upgraded
                        return undefined;
                    }
                    
                    // No matching WebSocket route
                    return new Response('WebSocket not found', { status: 404 });
                }
                
                // Handle regular HTTP requests
                const eSportsAppReq = new HttpRequest(
                    request
                ) as unknown as apiRequest;

                const eSportsAppRes =
                    new HttpResponse() as unknown as apiResponse;
                
                return await handler(eSportsAppReq, eSportsAppRes);
            } catch (error) {
                // Return a custom error response
                return errorResponse(
                    error,
                    request,
                    this.options.debug ?? false
                );
            }
        },
        // WebSocket event handlers
        websocket: {
            open(ws:any) {
                // Add to the appropriate group
                wsRouter.addToGroup(ws.data.groupPath, ws);
                
                // Call the handler for the matched route
                const { route } = wsRouter.matchRoute(ws.data.groupPath);
                if (route?.handler.open) {
                    route.handler.open(ws, ws.data.id);
                }
            },
            message(ws: any, message: any) {
                const { route } = wsRouter.matchRoute(ws.data.groupPath);
                if (route?.handler.message) {
                    route.handler.message(ws, message, ws.data.id);
                }
            },
            close(ws: any, code: any, reason: any) {
                // Remove from group
                wsRouter.removeFromGroup(ws.data.groupPath, ws);
                
                const { route } = wsRouter.matchRoute(ws.data.groupPath);
                if (route?.handler.close) {
                    route.handler.close(ws, code, reason, ws.data.id);
                }
            },
            drain(ws: any) {
                const { route } = wsRouter.matchRoute(ws.data.groupPath);
                if (route?.handler.drain) {
                    route.handler.drain(ws, ws.data.id);
                }
            }
        }
    });
    
    if (cb) {
        cb();
    } else {
        console.log(`✔ Server started on port: ${port} with WebSocket support`);
    }
}


}