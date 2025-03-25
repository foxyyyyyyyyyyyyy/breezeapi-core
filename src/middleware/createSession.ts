import type { apiNext, apiRequest, apiResponse } from "@Types";

// Simple in-memory session store
const sessions = new Map();

export interface SessionOptions {
  secret: string;
  resave: boolean;
  saveUninitialized: boolean;
  name?: string;
  maxAge?: number;
}

export const createSessionMiddleware = (options: SessionOptions) => {
  const { 
    secret, 
    resave = false, 
    saveUninitialized = false,
    name = 'sessionId',
    maxAge = 24 * 60 * 60 * 1000 // 24 hours by default
  } = options;

  return async (req: apiRequest, res: apiResponse, next: apiNext) => {
    // Get or generate session ID
    let sessionId = req.cookies?.[name];
    
    if (!sessionId) {
      // Generate a new session ID if none exists
      const timestamp = Date.now().toString();
      const randomValue = Math.random().toString();
    sessionId = Bun.CryptoHasher.hash('sha256', timestamp + randomValue + secret).toString('hex');
      
      // Set cookie with the session ID
      res.header('Set-Cookie', `${name}=${sessionId}; Path=/; HttpOnly; Max-Age=${maxAge}`);
    }
    
    // Initialize or retrieve session data
    if (!sessions.has(sessionId) && saveUninitialized) {
      sessions.set(sessionId, {});
    }
    
    // Attach session to request
    req.session = sessions.get(sessionId) || {};
    
    // Method to save session
    req.saveSession = () => {
      sessions.set(sessionId, req.session);
    };
    
    // Auto-save session if resave is true
    const response = await next();
    
    if (resave) {
      sessions.set(sessionId, req.session);
    }
    
    return response;
  };
};