import type {
    Middleware,
    apiRequest,
    apiResponse,
    apiNext,
} from '@Types';

/**
 * Example of a global middleware function. This middleware logs a message to
 * the console whenever it is executed.
 * @param req - The apiRequest object.
 * @param res - The apiResponse object.
 * @param next - The next middleware function to call.
 * @returns A Promise resolved with the response from the next middleware function.
 */
export const globalMiddleware1: Middleware = async (
    req: apiRequest,
    res: apiResponse,
    next: apiNext
) => {
    console.log('Global middleware executed.');

    // Call the next middleware
    return await next();
};
