import type {
    apiRequest,
    apiResponse,
    Middleware,
    apiNext,
} from '@src';

// Global middleware example: a simple logger.
export const globalLogger: Middleware = async (
    req: apiRequest,
    res: apiResponse,
    next: apiNext
) => {
    console.log(`[Global Logger] ${req.method} ${req.url}`);
    return next();
};
