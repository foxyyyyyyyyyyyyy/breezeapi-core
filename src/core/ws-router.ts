import { readdir } from 'fs/promises';
import * as path from 'path';
import type{ WebSocketData, WebSocketHandler, WebSocketRouteDefinition } from '@Types';



export class WebSocketRouter {
    private routes: WebSocketRouteDefinition[] = [];
    private socketGroups: Map<string, Set<WebSocket & { data: WebSocketData }>> = new Map();
    
        constructor(private socketDir: string, private prefix: string = 'socket') {
        if (!socketDir) {
            throw new Error('Socket directory path is required');
        }
        
        // Ensure socketDir is absolute
        this.socketDir = path.isAbsolute(socketDir) 
            ? socketDir 
            : path.resolve(process.cwd(), socketDir);
            
        // Normalize the prefix
        this.prefix = prefix.startsWith('/') ? prefix : `/${prefix}`;
        
        console.log(`WebSocketRouter initialized with directory: ${this.socketDir}`);
    }
    
    // Get all routes
    get webSocketRoutes() {
        return this.routes;
    }
    
    // Match a URL pathname to a WebSocket route
    public matchRoute(path: string): { route?: WebSocketRouteDefinition; id?: string } {
        // Clean up the path
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        
        // Regular match first
        const exactRoute = this.routes.find(route => route.path === cleanPath);
        if (exactRoute) {
            return { route: exactRoute };
        }
        
        // Check for dynamic routes with [id]
        for (const route of this.routes) {
            // If the route has a dynamic segment (ends with /:param)
            if (route.path.includes('/:')) {
                const routeParts = route.path.split('/');
                const pathParts = cleanPath.split('/');
                
                // Skip if different number of segments except when last segment is dynamic
                if (routeParts.length !== pathParts.length) {
                    continue;
                }
                
                // Check if all parts match except the last dynamic one
                let match = true;
                let dynamicId;
                
                for (let i = 0; i < routeParts.length; i++) {
                    if (routeParts[i].startsWith(':')) {
                        // This is a parameter segment, capture the value
                        dynamicId = pathParts[i];
                    } else if (routeParts[i] !== pathParts[i]) {
                        match = false;
                        break;
                    }
                }
                
                if (match) {
                    return { route, id: dynamicId };
                }
            }
        }
        
        return {}; // No match
    }
    
    // Add a WebSocket to a group
    public addToGroup(path: string, ws: WebSocket & { data: WebSocketData }): void {
        if (!this.socketGroups.has(path)) {
            this.socketGroups.set(path, new Set());
        }
        this.socketGroups.get(path)!.add(ws);
    }
    
    // Remove a WebSocket from a group
    public removeFromGroup(path: string, ws: WebSocket & { data: WebSocketData }): void {
        if (this.socketGroups.has(path)) {
            this.socketGroups.get(path)!.delete(ws);
            // Clean up empty groups
            if (this.socketGroups.get(path)!.size === 0) {
                this.socketGroups.delete(path);
            }
        }
    }
    
    // Get all sockets in a group
    public getGroupSockets(path: string): Set<WebSocket & { data: WebSocketData }> {
        return this.socketGroups.get(path) || new Set();
    }
    
    // Broadcast a message to all sockets in a group
    public broadcast(path: string, message: string | Buffer): void {
        const sockets = this.getGroupSockets(path);
        for (const socket of sockets) {
            socket.send(message);
        }
    }
    
    // Load routes from filesystem
    public async loadRoutes(): Promise<void> {
        // Implementation will depend on your specific requirements
        // This is a simple placeholder
        
        // In a real implementation, you would:
        // 1. Scan the socketDir for route files
        // 2. Load each route module and add it to this.routes
        // Example implementation:
        await this.scanDirectory(this.socketDir);
    }
    
              // Scan directory for route files
        private async scanDirectory(dir: string, basePath: string = ''): Promise<void> {
            try {
                // Ensure dir is absolute
                const absoluteDir = path.isAbsolute(dir) ? dir : path.resolve(dir);
                
                const entries = await readdir(absoluteDir, { withFileTypes: true });
                
                for (const entry of entries) {
                    const fullPath = path.join(absoluteDir, entry.name);
                    
                    if (entry.isDirectory()) {
                        // Handle dynamic segments [id]
                        const segment = entry.name.startsWith('[') && entry.name.endsWith(']') 
                            ? `:${entry.name.slice(1, -1)}` 
                            : entry.name;
                        
                        // We need to make sure we join path segments correctly for route paths
                        // Use a normalized join that uses forward slashes
                        let newBasePath = basePath ? `${basePath}/${segment}` : segment;
                        
                        await this.scanDirectory(fullPath, newBasePath);
                    } else if (entry.name === 'socket.ts' || entry.name === 'socket.js') {
                        await this.loadRouteModule(fullPath, basePath);
                    }
                }
            } catch (error) {
                console.error(`Error scanning directory ${dir}:`, error);
            }
        }
    
        // Load a route module
    private async loadRouteModule(filePath: string, basePath: string): Promise<void> {
        try {
            // Convert basePath to a proper route path with prefix
            // Use URL-style path separators consistently
            const normalizedBasePath = basePath.replace(/\\/g, '/');
            
            // Ensure there's a separator between prefix and path
            const routePath = normalizedBasePath 
                ? `${this.prefix}/${normalizedBasePath}` 
                : this.prefix;
            
            // Use absolute path for imports
            const absolutePath = path.resolve(filePath);
            
            
            // Import the route module - use file:// protocol for Bun
            const routeModule = await import(`file://${absolutePath}`);
            
            // Create handler from module exports
            const handler: WebSocketHandler = {
                open: routeModule.onOpen || routeModule.default?.onOpen,
                message: routeModule.onMessage || routeModule.default?.onMessage,
                close: routeModule.onClose || routeModule.default?.onClose,
                drain: routeModule.onDrain || routeModule.default?.onDrain,
            };
            
            // Verify that at least one handler is defined
            if (!handler.open && !handler.message && !handler.close && !handler.drain) {
                console.warn(`WebSocket route has no handlers: ${routePath}`);
                return;
            }
            
            // Add route to routes array
            this.routes.push({
                path: routePath,
                handler,
            });
            
            console.log(`➕ Successfully registerd WebSocket route: ${routePath}`);
        } catch (error) {
            console.error(`Failed to load WebSocket route: ${filePath}`, error);
        }
    }
}