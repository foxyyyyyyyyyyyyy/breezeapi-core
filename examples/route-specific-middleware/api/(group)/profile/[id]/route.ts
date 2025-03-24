import type { apiRequest, apiResponse, apiNext } from '@src';

// Route-specific middleware
export const middleware = [
    async (req: apiRequest, res: apiResponse, next: apiNext) => {
        console.log('Profile Route-specific middleware executed');
        return await next();
    },
];

export async function GET(req: apiRequest, res: apiResponse) {
    const query = req.query;

    return res.json({
        id: req?.params?.id,
        query: query,
        name: 'John Doe',
    });
}
