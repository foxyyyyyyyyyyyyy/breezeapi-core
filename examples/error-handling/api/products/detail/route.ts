import type { apiRequest, apiResponse } from '@src';

export async function GET(req: apiRequest, res: apiResponse) {
    console.log('[GET] Product Detail route invoked');

    return res.json({
        name: 'Sample Product',
    });
}
