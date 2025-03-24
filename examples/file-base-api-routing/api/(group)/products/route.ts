import type { apiRequest, apiResponse } from '@src';

export async function GET(req: apiRequest, res: apiResponse) {
    return res.json({
        message: 'Product Detail',
    });
}
