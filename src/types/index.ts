import { z } from 'zod';
export type { BunRequest } from 'bun';

export interface ServerOptions {
    /**
     * The title of the API. This is an optional property that can be used
     * to specify a custom title for the API documentation.
     */
    title?: string;

    /**
     * The description of the API. This is an optional property that can be used
     * to provide a brief overview of the API.
     */
    description?: string;

    /**
     * Favicon of the api and documentation.
     * This is an optional property that can be used to specify a custom favicon for the API documentation.
     * TODO: implement favicon for the api 
     */
    favicon?: string;

    /**
     * The directory path to load API routes from.
     * If not specified, no API routes are loaded.
     */
    apiDir?: string;

    /**
     * The directory path to load Page routes from.
     * If not specified, no Page routes are loaded.
     * Page routes are not yet supported, but will be supported in the future.
     */
    pageDir?: string;

    /**
     * Global middleware to be executed before each request.
     */
    globalMiddleware?: Middleware[];

    /**
     * The version of the API. This is an optional property that can be used
     * to specify the version of the API.
     * TODO: use it for multi version support in the future. example migration between different versions
     */
    version?: string;

    /**
     * Enables or disables debug mode. This is an optional property
     * that, when set to true, can be used to output additional debugging
     * information to the console or logs to aid in development and troubleshooting.
     */
    debug?: boolean;

    /**
     * Allow cookies and parse them automatically
     */
    cookie?: boolean;

    /**
     * Cors configuration for the API. This is an optional property that can be used
     * to configure Cross-Origin Resource Sharing (CORS) for the API.
     */
    cors?: {
        /**
         * The Access-Control-Allow-Origin header value.
         * This can be a string or an array of strings.
         */
        origin?: string | string[] | true;

        /**
         * The Access-Control-Allow-Methods header value.
         * This can be a string or an array of strings.
         */
        methods?: string | string[];

        /**
         * The Access-Control-Allow-Headers header value.
         * This can be a string or an array of strings.
         */
        allowedHeaders?: string | string[];

        /**
         * The Access-Control-Expose-Headers header value.
         * This can be a string or an array of strings.
         */
        exposedHeaders?: string | string[];

        /**
         * The Access-Control-Allow-Credentials header value.
         * This can be a boolean.
         */
        credentials?: boolean;

        /**
         * The Access-Control-Max-Age header value.
         * This can be a number.
         */
        maxAge?: number;
    };

    config?: {
        /**
         * Use Session middleware for the API. This is an optional property that can be used
         * to enable session management for the API.
         */
        session?: boolean;

        /**
         * Use Cookie middleware for the API. This is an optional property that can be used
         * to enable cookie management for the API.
         */
        cookie?: boolean;
    }
}

export type DefaultRequestProperties = {
    params?: Record<string, unknown>;
    query?: Record<string, unknown>;
    body?: Record<string, unknown>;
};

export interface apiRequest<
    RequestValidatedProperties extends DefaultRequestProperties = DefaultRequestProperties
> extends Request {
    [x: string]: any;
    /**
     * Provides helper to access query parameters as URLSearchParams.
     * This is a convenience property that allows you to access the query
     * parameters of the request as a URLSearchParams object, which provides
     * methods for working with the query parameters like `get(key)`,
     * `getAll(key)`, `has(key)`, `keys()`, `values()`, `entries()`, and more.
     */
    query: URLSearchParams;

    /**
     * Contains URL parameters extracted from the request path.
     * This property is only present if the request path matches a route
     * with dynamic parameters.
     *
     * For example, if the route is `/users/:id`, and the request path is
     * `/users/123`, then the `params` property will be `{ id: '123' }`.
     */
    params?: Record<string, string>;

    /**
     * Contains validated data for the request.
     * This is an optional property that will only be present if
     * a middleware has validated the request data and attached the
     * validated data to the request.
     *
     * Properties:
     * - `params`: Validated URL parameters.
     * - `query`: Validated query string parameters.
     * - `body`: Validated request body (if JSON).
     */
    validated: RequestValidatedProperties;

    /**
     * Method to save session
     */
    saveSession: () => void;

    /**
     * Node.js/Bun compatibility: Listen for events (e.g., 'close', 'error').
     */
    on?(event: string, listener: (...args: any[]) => void): void;

    /**
     * Node.js/Bun compatibility: Pipe the request to a writable stream.
     */
    pipe?(destination: any, options?: { end?: boolean }): any;

    /**
     * Bun: Returns the request body as a ReadableStream.
     */
    body: ReadableStream<Uint8Array> | null;

    /**
     * Bun: Returns the request body as an ArrayBuffer.
     */
    arrayBuffer(): Promise<ArrayBuffer>;

    /**
     * Bun: Returns the request body as a Blob.
     */
    blob(): Promise<Blob>;

    /**
     * Bun: Returns the request body as FormData.
     */
    formData(): Promise<FormData>;

    /**
     * Bun: Returns the request body as JSON.
     */
    json<T = any>(): Promise<T>;

    /**
     * Bun: Returns the request body as text.
     */
    text(): Promise<string>;

    /**
     * Bun: Returns the request headers as a Headers object.
     */
    headers: Headers;

    /**
     * Bun: The HTTP method.
     */
    method: string;

    /**
     * Bun: The request URL.
     */
    url: string;

    /**
     * Bun: The request signal (for aborting).
     */
    signal: AbortSignal;

    /**
     * Bun: The request credentials.
     */
    credentials: RequestCredentials;

    /**
     * Bun: The request referrer.
     */
    referrer: string;

    /**
     * Bun: The request referrer policy.
     */
    referrerPolicy: ReferrerPolicy;

    /**
     * Bun: The request mode.
     */
    mode: RequestMode;

    /**
     * Bun: The request cache.
     */
    cache: RequestCache;

    /**
     * Bun: The request redirect.
     */
    redirect: RequestRedirect;

    /**
     * Bun: The request integrity.
     */
    integrity: string;

    /**
     * Bun: The request keepalive.
     */
    keepalive: boolean;

    /**
     * BreezeAPI: Middleware storage for the request.
     * This property is used to store middleware-specific data that can be
     * accessed by routes and middleware functions during the request handling process.
     */
    middleware?: Record<string, any>;

    /**
     * Bun: Cookie API (Bun.serve attaches this automatically).
     * Provides get/set/delete for cookies.
     */
    cookies?: {
        get(name: string): string | undefined;
        set(name: string, value: string, options?: CookieOptions): void;
        delete(name: string, options?: CookieOptions): void;
        // Bun's cookies API may have more methods, but these are the main ones.
    };

}

export interface apiResponse {
    /**
     * Sets a header value.
     * @param name - The header name.
     * @param value - The header value.
     * @returns The current instance for chaining.
     */
    header(name: string, value: string): this;

    /**
     * Sets a header value.
     * @param name - The header name.
     * @param value - The header value.
     * @returns The current instance for chaining.
     */
    setHeader(name: string, value: string): this;

    /**
     * Removes a header.
     * @param name - The header name to remove.
     * @returns The current instance for chaining.
     */
    removeHeader(name: string): this;

    /**
     * Sets the HTTP status code.
     * @param status - The status code.
     * @returns The current instance for chaining.
     */
    status(status: number): this;

    /**
     * Sets the response body.
     * @param body - The body content.
     * @returns The current instance for chaining.
     */
    body(body: BodyInit): this;

    /**
     * Builds and returns the final Response object using the current state.
     * This should be called only once when the response is finalized.
     * @returns The final Response object.
     */
    build(): Response;

    /**
     * Convenience method to send a JSON response.
     * Sets the "Content-Type" header and serializes the data to JSON.
     * @param data - The data to send.
     * @returns The final Response object.
     */
    json(data: unknown): Response;

    /**
     * Convenience method to send a plain text response.
     * Sets the "Content-Type" header and returns a text response.
     * @param data - The text to send.
     * @returns The final Response object.
     */
    text(data: string): Response;

    /**
     * Convenience method to send an HTML response.
     * Sets the "Content-Type" header and returns an HTML response.
     * @param data - The HTML string to send.
     * @returns The final Response object.
     */
    html(data: string): Response;

    /**
     * Convenience method to send a redirect response.
     * Sets the "Location" header and status code.
     * @param url - The URL to redirect to.
     * @param status - The HTTP status code (default 302).
     * @returns The current instance for chaining.
     */
    redirect(url: string, status?: number): this;

    /**
     * Convenience method to send a file response using Bun.file.
     * @param filePath - The file path to serve.
     * @returns The final Response object.
     */
    file(filePath: string): Response;

    /**
     * Returns a Response directly using the provided body and init settings.
     * This bypasses the mutable state.
     * @param body - The response body.
     * @param init - Optional ResponseInit settings.
     * @returns A new Response object.
     */
    original(body?: BodyInit | null, init?: ResponseInit): Response;

    /**
     * Sets the response body to a JSON error message.
     * @param message - The error message.
     * @param status - The HTTP status code (default 500).
     * @returns The final Response object.
     */
    error(message: string, status?: number): Response;

    /**
     * Sets the response body to a JSON success message.
     * @param message - The success message.
     * @param status - The HTTP status code (default 200).
     * @returns The final Response object.
     */
    success(message: string, status?: number): Response;

    /**
     * Set a cookie in the response.
     * @param name - The cookie name.
     * @param value - The cookie value.
     * @param options - Optional cookie settings.
     * @returns The current instance for chaining.
     */
    cookie(name: string, value: string, options?: CookieOptions): this;

    /**
     * Bun/Node.js: Write data to the response stream (for SSE, etc.).
     * If supported by the underlying server.
     */
    send(data: string | Uint8Array, close?: boolean): this;

    /**
     * Bun/Node.js: Flush the response headers (for SSE, etc.).
     */
    flush?(): void;

    /**
     * Bun/Node.js: End the response (for streaming/SSE).
     */
    end?(): void;

    /**
     * Bun/Node.js: Write data to the response stream (alias for send).
     */
    write?(data: string | Uint8Array): void;

    /**
     * Bun/Node.js: Pipe a readable stream to the response.
     */
    pipe?(stream: ReadableStream<any>): void;

    /**
     * Bun: Returns the response as a Response object.
     */
    toResponse?(): Response;

    /**
     * Bun: Returns the response headers as a Headers object.
     */
    headers?: Headers;

    /**
     * Bun: The response status code.
     */
    statusCode?: number;

    /**
     * Bun: The response URL.
     */
    url?: string;
}

export interface CookieOptions {
    /**
     * The domain for the cookie.
     */
    domain?: string;

    /**
     * The path for the cookie.
     */
    path?: string;

    /**
     * The maximum age of the cookie in seconds.
     */
    maxAge?: number;

    /**
     * The expiration date of the cookie.
     */
    expires?: Date;

    /**
     * The same-site policy of the cookie.
     */
    sameSite?: 'strict' | 'lax' | 'none';

    /**
     * The secure flag of the cookie.
     */
    secure?: boolean;

    /**
     * The HttpOnly flag of the cookie.
     */
    httpOnly?: boolean;
}

/**
 * Represents a next function in the request handling pipeline.
 * This function is used to call the next middleware in the chain.
 * It returns a Promise that resolves with a Response object.
 */
export type apiNext = () => Promise<Response>;

/**
 * Represents a request handler function.
 * Request handler functions receive a apiRequest and apiResponse as
 * arguments. They must return a Response object, which can be either a Promise
 * that resolves with a Response object or a Response object directly.
 *
 * @param request - The incoming apiRequest object.
 * @param response - The outgoing apiResponse object.
 * @returns A Response object or a Promise that resolves with a Response object.
 */
export type RequestHandler = (
    request: apiRequest,
    response: apiResponse
) => Promise<Response> | Response;

/**
 * Represents a middleware function in the request handling pipeline.
 * Middleware functions have the ability to modify the request and response
 * objects, end the request-response cycle, or call the next middleware function
 * in the chain. They are executed in the order they are defined.
 *
 * @param request - The incoming apiRequest object.
 * @param response - The outgoing apiResponse object.
 * @param next - A function to call the next middleware in the chain.
 * @returns A Promise that resolves with the response.
 */
export type Middleware = (
    request: apiRequest,
    response: apiResponse,
    next: apiNext
) => Promise<Response>;

/**
 * Middleware/guard function that can receive configuration options
 */
export type ConfigurableMiddleware = (
    request: apiRequest,
    response: apiResponse,
    next: apiNext,
    config?: any
) => Promise<Response>;

export interface RouteDefinition {
    /**
     * The path of the route.
     */
    path: string;
    /**
     * An object containing the request handlers for each HTTP method.
     * The keys are the HTTP method names (e.g. "GET", "POST", etc.).
     * The values are the request handlers for that method.
     */
    handlers: { [method: string]: RequestHandler };
    /**
     * An array of middleware functions to run before the request handler.
     * The middleware functions will be run in the order they are specified.
     */
    middleware?: Middleware[];

    /**
     * An optional route schema to validate the request data against.
     * This property is set by the user when defining a route.
     * The schema is used to validate the request data for each HTTP method.
     * The keys are the HTTP method names (in lowercase) and the values are
     * the Zod schema objects for that method.
     */
    schema?: RouteSchema;

    /**
     * Optional OpenAPI metadata to generate documentation for the route.
     * If provided, this property should define an object where each key
     * is an HTTP method name (in lowercase), and the value is an object
     * containing the OpenAPI metadata for that method.
     */
    openapi?: openapi;

    /**
     * Configuration for the route.
     */
    config: RouteConfig;
}


/**
 * Configuration for a route
 */
export interface RouteConfig {
    /**
     * Middleware to be applied to this specific route
     * Can be an array of middleware functions or a record of named middleware with configuration
     */
    middleware?: Array<Middleware> | Record<string, MiddlewareDefinition>;

    /**
     * Guards to be applied to this specific route (run before middleware)
     * Can be an array of guard functions or a record of named guards with configuration
     */
    guards?: Array<Middleware> | Record<string, GuardDefinition>;

    /**
     * Allow for other configuration options
     */
    [key: string]: any;
}

/**
 * Definition for a configurable middleware with options
 */
export interface MiddlewareDefinition {
    /**
     * The middleware handler function
     */
    handler: ConfigurableMiddleware;

    /**
     * Configuration options to be passed to the middleware
     */
    options?: any;
}

/**
 * Definition for a configurable guard with options
 */
export interface GuardDefinition {
    /**
     * The guard handler function
     */
    handler: ConfigurableMiddleware;

    /**
     * Configuration options to be passed to the guard
     */
    options?: any;
}





/**
 * Define a type for the route schema.
 * For each HTTP method (in lowercase), you can optionally define:
 * - params: for URL parameters,
 * - query: for query string parameters,
 * - body: for the request body.
 */
export type RouteSchema = {
    [method: string]: {
        params?: z.ZodTypeAny;
        query?: z.ZodTypeAny;
        body?: z.ZodTypeAny;
    };
};

/**
 * Optional OpenAPI metadata to generate documentation for the route.
 * Each key is an HTTP method name (in lowercase) and the value is an object
 * containing the OpenAPI metadata for that method.
 *
 * If the `openapi` property is not defined, the route will not be included in
 * the generated OpenAPI documentation.
 *
 * See the OpenAPI specification for the possible properties and their
 * descriptions.
 */
export type openapi = {
    [method: string]: {
        summary?: string;
        description?: string;
        tags?: string[];
        operationId?: string;
        deprecated?: boolean;
        responses?: Record<string, any>;
        externalDocs?: {
            description?: string;
            url?: string;
        };
    };
};

export interface PageDefinition {
    path: string;
    handler: RequestHandler;
    middleware?: RequestHandler[];
}

export interface TrieNode {
    children: Map<string, TrieNode>; // Normal path pieces, like "users"
    paramChild?: TrieNode; // For dynamic pieces, like ":id"
    paramName?: string; // Name of the dynamic piece, like "id"
    route?: RouteDefinition; // The route definition for the node
}

// Add WebSocket types to the ServerOptions interface
export interface ServerOptions {
    // Existing properties...

    /**
     * The directory path to load WebSocket routes from.
     * If not specified, no WebSocket routes are loaded.
     */
    socketDir?: string;
}



export interface WebSocketRouteDefinition {
    path: string;
    handler: WebSocketHandler;
}

export interface WebSocketData {
    id?: string;
    groupPath?: string;
    createdAt: number;
}

// WebSocket handler interface
export interface WebSocketHandler {
    open?: (ws: WebSocket & { data: WebSocketData }, id?: string) => void;
    message?: (ws: WebSocket & { data: WebSocketData }, message: string | Buffer, id?: string) => void;
    close?: (ws: WebSocket & { data: WebSocketData }, code: number, reason: string, id?: string) => void;
    drain?: (ws: WebSocket & { data: WebSocketData }, id?: string) => void;
}

// WebSocket route definition
export interface WebSocketRouteDefinition {
    path: string;
    handler: WebSocketHandler;
}

/**
 * Type for the SSE send function.
 * Sends a message to the client as an SSE event.
 * @param data - The data to send (object or string).
 * @param event - Optional event name.
 */
export type SseSend = (data: any, event?: string) => void;

