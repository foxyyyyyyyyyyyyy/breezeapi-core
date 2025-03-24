export class HttpRequest {
    private _request: Request;
    private _query?: URLSearchParams;

    /**
     * Creates a new HttpRequest object from the given Request object.
     * @param request - The Request object to wrap.
     */
    constructor(request: Request) {
        this._request = request;
        this._query = new URL(request.url).searchParams;
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
