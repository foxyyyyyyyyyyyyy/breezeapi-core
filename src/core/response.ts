import type{ CookieOptions } from '@Types';
export class HttpResponse {
    
    /**
     * The status code of the response, which defaults to 200 (OK). This
     * property can be modified before calling build() to construct the
     * Response object.
     */
    private _status: number = 200;
    /**
     * The headers of the response, which can be modified before calling build()
     * to construct the Response object.
     */
    private _headers: Headers = new Headers();
    /**
     * The body of the response, which can be any valid BodyInit type or null.
     */
    private _body: BodyInit | null = null;

    /**
     * Set a header on the response.
     * @param name - The header name.
     * @param value - The header value.
     * @returns The response object.
     */
    public header(name: string, value: string): this {
        this._headers.set(name, value);
        return this;
    }

    /**
     * Set a header on the response.
     * @param name - The header name.
     * @param value - The header value.
     * @returns The response object.
     */
    public setHeader(name: string, value: string): this {
        this._headers.set(name, value);
        return this;
    }

    /**
     * Appends a header to the response. Unlike header/setHeader, this does not
     * overwrite existing headers of the same name. Useful for Set-Cookie.
     * @param name - The header name.
     * @param value - The header value.
     * @returns The response object.
     */
    public appendHeader(name: string, value: string): this {
        this._headers.append(name, value);
        return this;
    }

    /**
     * Set a cookie in the response.
     * @param name - The cookie name.
     * @param value - The cookie value.
     * @param options - Optional cookie settings.
     * @returns The current instance for chaining.
     */
    public cookie(name: string, value: string, options?: CookieOptions): this {
        const parts: string[] = [`${name}=${encodeURIComponent(value)}`];

        if (options) {
            if (options.domain) {
                parts.push(`Domain=${options.domain}`);
            }

            if (options.path) {
                parts.push(`Path=${options.path}`);
            } else {
                 // Add a default path if none is provided
                parts.push('Path=/');
            }

            if (options.maxAge !== undefined) { // Check for undefined specifically
                parts.push(`Max-Age=${options.maxAge}`);
            }

            if (options.expires) {
                parts.push(`Expires=${options.expires.toUTCString()}`);
            }

            if (options.sameSite) {
                parts.push(`SameSite=${options.sameSite}`);
            }

            if (options.secure) {
                parts.push('Secure');
            }

            if (options.httpOnly) {
                parts.push('HttpOnly');
            }
        }

        const cookieString = parts.join('; ');
        // *** CHANGE THIS LINE ***
        // Use appendHeader instead of header/setHeader
        this.appendHeader('Set-Cookie', cookieString);
        return this;
    }

   

    /**
     * Remove a header from the response.
     * @param name - The header name.
     * @returns The response object.
     */
    public removeHeader(name: string): this {
        this._headers.delete(name);
        return this;
    }

    /**
     * Sets the HTTP status code of the response.
     * @param status - The status code.
     * @returns The response object.
     */
    public status(status: number): this {
        this._status = status;
        return this;
    }

    /**
     * Sets the body of the response.
     * @param body - The content to be used as the response body.
     * @returns The response object for method chaining.
     */
    public body(body: BodyInit): this {
        this._body = body;
        return this;
    }

    /**
     * Sets the content type to "application/json" and serializes the provided data
     * into a JSON string to set as the response body.
     * @param data - The data to be serialized and sent as the response body.
     * @returns The finalized Response object after building.
     */
    public json(data: unknown): Response {
        this.header('Content-Type', 'application/json');
        this._body = JSON.stringify(data);
        return this.build();
    }

    /**
     * Sets the content type to "text/plain" and assigns the provided text data
     * as the response body.
     * @param data - The text to be sent as the response body.
     * @returns The finalized Response object after building.
     */
    public text(data: string): Response {
        this.header('Content-Type', 'text/plain');
        this._body = data;
        return this.build();
    }

    /**
     * Sets the content type to "text/html" and assigns the provided HTML data
     * as the response body.
     * @param data - The HTML string to be sent as the response body.
     * @returns The finalized Response object after building.
     */
    public html(data: string): Response {
        this.header('Content-Type', 'text/html');
        this._body = data;
        return this.build();
    }

    /**
     * Sets the HTTP status code and removes the "Location" header from the
     * response.
     * @param status - The status code.
     * @returns The response object.
     */
    public redirect(url: string, status: number = 302): this {
        this.status(status);
        this.header('Location', url);
        this._body = null;
        return this;
    }

    /**
     * Convenience method to send a file response using Bun.file.
     * Attempts to serve the specified file and set it as the response body.
     * If the file cannot be found or an error occurs, logs the error and
     * returns a 404 response with "File not found" as the body.
     * @param filePath - The file path to serve.
     * @returns The finalized Response object.
     */
    public file(filePath: string): Response {
        try {
            const file = Bun.file(filePath);
            this._body = file;
            return this.build();
        } catch (error) {
            console.error('Error serving file:', error);
            this.status(404);
            this._body = 'File not found';
            return this.build();
        }
    }

    /**
     * Returns a Response directly using the provided body and init settings.
     * This bypasses the mutable state.
     * @param body - The response body.
     * @param init - Optional ResponseInit settings.
     * @returns A new Response object.
     */
    public original(body?: BodyInit | null, init?: ResponseInit): Response {
        return new Response(body, init);
    }

    /**
     * Builds the final Response object using the current state.
     * @returns The finalized Response object.
     */
    public build(): Response {
        return new Response(this._body, {
            status: this._status,
            headers: this._headers,
        });
    }

    /**
     * Sets the response body to a JSON error message.
     * @param message - The error message.
     * @param status - The HTTP status code (default 500).
     * @returns The final Response object.
     */
    public error(message: string, status: number = 500): Response {
        this.status(status);
        return this.json({
            success: false,
            error: message
        });
    }

    /**
     * Sets the response body to a JSON success message.
     * @param message - The success message.
     * @param status - The HTTP status code (default 200).
     * @returns The final Response object.
     */
    public success(message: string, status: number = 200): Response {
        this.status(status);
        return this.json({
            success: true,
            message: message
        });
    }

 
}
