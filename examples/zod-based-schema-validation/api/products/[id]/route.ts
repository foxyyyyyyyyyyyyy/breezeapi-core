// Import stuff from zod
import { z } from 'zod';

// Import types
import type { apiRequest, apiResponse, apiNext } from '@src';

// Export a schema for GET requests.
export const schema = {
    get: {
        params: z.object({
            id: z.string().min(1, 'ID is required'),
        }),
    },
};

// Route-specific middleware
export const middleware = [
    async (req: apiRequest, res: apiResponse, next: apiNext) => {
        console.log('Product Detail Route-specific middleware executed');
        return await next();
    },
];

export async function GET(
    req: apiRequest<{ params: z.infer<typeof schema.get.params> }>,
    res: apiResponse
) {
    const validatedParams = req.validated?.params;
    return res.json({
        id: validatedParams,
        name: 'John Doe',
    });
}
