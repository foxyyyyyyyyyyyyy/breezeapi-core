import type { apiNext, apiRequest, apiResponse } from "@Types";

export interface CorsOptions {
  origin?: string | string[] | boolean;
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

export const createCorsMiddleware = (options: CorsOptions = {}) => {
  const {
    origin = '*',
    methods = ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders = [],
    exposedHeaders = [],
    credentials = false,
    maxAge = 86400
  } = options;
  
  return async (req: apiRequest, res: apiResponse, next: apiNext) => {
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      const headers = new Headers();
      
      // Set CORS headers
      headers.set('Access-Control-Allow-Methods', methods.join(','));
      
      if (allowedHeaders.length) {
        headers.set('Access-Control-Allow-Headers', allowedHeaders.join(','));
      } else {
        const requestHeaders = req.headers.get('Access-Control-Request-Headers');
        if (requestHeaders) {
          headers.set('Access-Control-Allow-Headers', requestHeaders);
        }
      }
      
      if (exposedHeaders.length) {
        headers.set('Access-Control-Expose-Headers', exposedHeaders.join(','));
      }
      
      if (credentials) {
        headers.set('Access-Control-Allow-Credentials', 'true');
      }
      
      headers.set('Access-Control-Max-Age', maxAge.toString());
      
      // Set origin header
      if (typeof origin === 'string') {
        headers.set('Access-Control-Allow-Origin', origin);
      } else if (Array.isArray(origin)) {
        const requestOrigin = req.headers.get('Origin') || '';
        if (origin.includes(requestOrigin)) {
          headers.set('Access-Control-Allow-Origin', requestOrigin);
        }
      } else if (origin === true) {
        const requestOrigin = req.headers.get('Origin') || '';
        headers.set('Access-Control-Allow-Origin', requestOrigin);
      }
      
      return new Response(null, { status: 204, headers });
    }
    
    // Handle actual requests
    const response = await next();
    const newHeaders = new Headers(response.headers);
    
    // Set origin header
    if (typeof origin === 'string') {
      newHeaders.set('Access-Control-Allow-Origin', origin);
    } else if (Array.isArray(origin)) {
      const requestOrigin = req.headers.get('Origin') || '';
      if (origin.includes(requestOrigin)) {
        newHeaders.set('Access-Control-Allow-Origin', requestOrigin);
      }
    } else if (origin === true) {
      const requestOrigin = req.headers.get('Origin') || '';
      newHeaders.set('Access-Control-Allow-Origin', requestOrigin);
    }
    
    if (credentials) {
      newHeaders.set('Access-Control-Allow-Credentials', 'true');
    }
    
    if (exposedHeaders.length) {
      newHeaders.set('Access-Control-Expose-Headers', exposedHeaders.join(','));
    }
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  };
};