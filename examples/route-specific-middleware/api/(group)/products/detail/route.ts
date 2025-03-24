import type { apiRequest, apiResponse, apiNext } from '@src';

// Route-specific middleware
export const middleware = [
    async (req: apiRequest, res: apiResponse, next: apiNext) => {
        console.log('Product Detail Route-specific middleware executed');
        return await next();
    },
];

export async function GET(req: apiRequest, res: apiResponse) {
    return res.json({
        message: 'Product Detail',
    });
}
