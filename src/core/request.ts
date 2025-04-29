import { CookieMap } from "bun";

export class HttpRequest {
    private _request: Request;
    private _query?: URLSearchParams;
    private _parsedCookies: Map<string, string> | null = null; // Cache for parsed cookies
    public params: Record<string, string> = {}; // Keep this if you use it

    /**
     * Creates a new HttpRequest object from the given Request object.
     * @param request - The Request object to wrap.
     */
    constructor(request: Request) {
        this._request = request;
        this._query = new URL(request.url).searchParams;
    }

     /**
     * Parses the 'Cookie' header from the request and returns a Map.
     * Caches the result in _parsedCookies.
     */
     private _parseCookies(): Map<string, string> {
        const map = new Map<string, string>();
        const cookieHeader = this._request.headers.get('cookie'); // Get header from original request

        if (!cookieHeader) {
            return map; // Return empty map if no header
        }

        cookieHeader.split(';').forEach(cookie => {
            // More robust split using indexOf
            let eq_idx = cookie.indexOf('=');

            // skip invalid cookies
            if (eq_idx < 0) {
                return;
            }

            const key = cookie.substring(0, eq_idx).trim();
            let value = cookie.substring(++eq_idx, cookie.length).trim();

            // Remove quotes if value is quoted
            if (value.charCodeAt(0) === 34) { // 34 is the ASCII code for "
                value = value.slice(1, -1);
            }

            // Decode value only if it hasn't been decoded before for this key
            if (map.get(key) === undefined) {
                try {
                    map.set(key, decodeURIComponent(value));
                } catch (e) {
                    // Handle potential decoding errors if necessary, or just set the raw value
                    map.set(key, value);
                }
            }
        });

        return map;
    }

    /**
     * Gets a Map of cookies parsed from the 'Cookie' request header.
     * The parsing is done lazily and cached for the lifetime of the request.
     * @returns {Map<string, string>} A Map containing cookie names and values.
     */
    get parsedCookies(): Map<string, string> {
        if (this._parsedCookies === null) {
            // Parse only if not already parsed for this request
            this._parsedCookies = this._parseCookies();
        }
        return this._parsedCookies;
    }

    /**
     * Gets the value of a specific cookie by name.
     * Uses the cached parsed cookies map.
     * @param name The name of the cookie to retrieve.
     * @returns The cookie value as a string, or undefined if the cookie doesn't exist.
     */
    public getCookie(name: string): string | undefined {
        return this.parsedCookies.get(name);
    }
    
    /**
     * Retrieves the query parameters from the request URL.
     * Initializes the query parameters if they are not already set.
     * @returns The URLSearchParams object containing the query parameters.
     */
    get query(): URLSearchParams {
        if (!this._query) {
            this._query = new URL(this._request.url).searchParams;
        }
        return this._query;
    }

    /**
     * Gets the URL of the request.
     * @returns The URL as a string.
     */
    get url() {
        return this._request.url;
    }

    /**
     * Gets the HTTP method of the request.
     * @returns The HTTP method as a string.
     */
    get method() {
        return this._request.method;
    }

    /**
     * Gets the headers of the request.
     * @returns The headers as a Headers object.
     */
    get headers() {
        return this._request.headers;
    }
    /**
     * NOTE: Bun does not reliably add the 'cookies' property (CookieMap)
     * to the Request object in all environments/configurations, even if a
     * Cookie header is present. Reading cookies must be done by manually
     * parsing the 'Cookie' header via req.headers.get('cookie').
     * Setting/deleting cookies must be done by adding 'Set-Cookie' headers
     * to the Response object (e.g., via an HttpResponse.cookie method).
     *
     * get cookies(): CookieMap | undefined {
     *     return (this._request as any).cookies;
     * }
     */

    /**
     * Gets the body of the request as JSON.
     * @returns The body as a Promise of the parsed JSON.
     */
    async json<T = any>(): Promise<T> {
        return this._request.json();
    }

    /**
     * Returns the original Request object.
     * @returns The original Request object.
     */
    get original(): Request {
        return this._request;
    }
}