import type { apiRequest, apiResponse } from '@src';

export async function GET(req: apiRequest, res: apiResponse) {
    const query = req.query;

    return res.json({
        id: req?.params?.id,
        query: query,
        name: 'John Doe',
    });
}
