// Add this import at the top
import { WebSocketRouter } from './websocket-router.js';

// Add this method to the Server class
/**
 * Starts the server with WebSocket support.
 * @param routes The HTTP routes.
 * @param handler The HTTP request handler.
 * @param wsRouter The WebSocket router.
 * @param port The port to listen on.
 * @param cb Optional callback function.
 */
public startWithWebSockets(
    routes: { [key: string]: any } | undefined,
    handler: RequestHandler,
    wsRouter: WebSocketRouter,
    port: number,
    cb?: () => void
): void {
    // Start Bun's native server using Bun.serve
    this.server = serve({
        routes,
        // eSportsApp's fetch handler
        fetch: async (request: Request) => {
            try {
                // Check if it's a WebSocket upgrade request
                if (request.headers.get('upgrade')?.toLowerCase() === 'websocket') {
                    const url = new URL(request.url);
                    const { route, id } = wsRouter.matchRoute(url.pathname);
                    
                    if (route) {
                        const { socket, response } = Bun.upgradeWebSocket(request, {
                            open(ws) {
                                // Add to the appropriate group
                                const groupPath = id ? `${route.path}/${id}` : route.path;
                                wsRouter.addToGroup(groupPath, ws);
                                
                                // Attach the id to the WebSocket object for easy reference
                                (ws as any).id = id;
                                (ws as any).groupPath = groupPath;
                                
                                // Call the handler
                                if (route.handler.open) {
                                    route.handler.open(ws, id);
                                }
                            },
                            message(ws, message) {
                                if (route.handler.message) {
                                    route.handler.message(ws, message, (ws as any).id);
                                }
                            },
                            close(ws, code, reason) {
                                // Remove from group
                                wsRouter.removeFromGroup((ws as any).groupPath, ws);
                                
                                if (route.handler.close) {
                                    route.handler.close(ws, code, reason, (ws as any).id);
                                }
                            },
                            drain(ws) {
                                if (route.handler.drain) {
                                    route.handler.drain(ws, (ws as any).id);
                                }
                            }
                        });
                        
                        return response;
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
                const res = new Response();
                res.headers.set('X-Powered-By', 'eSportsApp');
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
        console.log(`✔ Server started on port: ${port} with WebSocket support`);
    }
}