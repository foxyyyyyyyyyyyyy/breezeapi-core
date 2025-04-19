import type { apiNext, apiRequest, apiResponse } from "@Types";

// Extending the Request interface to allow parsedBody property assignment
declare global {
  interface Request {
    parsedBody?: any;
    rawBody?: string;
  }
}

export interface BodyParserOptions {
  limit?: string; // e.g., '50mb'
  validateJson?: boolean;
}

// Helper to parse size limit to bytes
function parseLimit(limit: string): number {
  const units: { [key: string]: number } = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024
  };
  
  const match = limit.toLowerCase().match(/^(\d+)([a-z]{1,2})$/);
  if (!match) return 1024 * 1024; // Default to 1MB
  
  const size = parseInt(match[1], 10);
  const unit = match[2];
  
  return size * (units[unit] || 1);
}

export const createBodyParserMiddleware = (options: BodyParserOptions = {}) => {
  const { 
    limit = '1mb',
    validateJson = true
  } = options;
  
  const maxBytes = parseLimit(limit);
  
  return async (req: apiRequest, res: apiResponse, next: apiNext) => {
    // Only process POST, PUT, PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const contentType = req.headers.get('content-type') || '';
      
      // Handle JSON content
      if (contentType.includes('application/json')) {
        try {
          // Check content length if available
          const contentLength = req.headers.get('content-length');
          if (contentLength && parseInt(contentLength, 10) > maxBytes) {
            return new Response('Request entity too large', { status: 413 });
          }
          
          // Read and parse body
          const text = await req.text();
          
          // Validate JSON if requested
          if (validateJson) {
            try {
              JSON.parse(text);
            } catch (e) {
              return new Response('Invalid JSON', { status: 400 });
            }
          }
          
          // Make the parsed body available and restore the original request's body
          req.parsedBody = JSON.parse(text);
          req.rawBody = text;
          
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          return new Response(`Error parsing request body: ${errorMessage}`, { 
            status: 400 
          });
        }
      }
      
      // Handle form data (application/x-www-form-urlencoded)
      else if (contentType.includes('application/x-www-form-urlencoded')) {
        try {
          const formData = await req.formData();
          const parsed: Record<string, any> = {};
          
          // Convert FormData to object
          formData.forEach((value, key) => {
            parsed[key] = value;
          });
          req.parsedBody = parsed;
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          return new Response(`Error parsing form data: ${errorMessage}`, { 
            status: 400 
          });
        }
      }
    }
    
    return next();
  };
};