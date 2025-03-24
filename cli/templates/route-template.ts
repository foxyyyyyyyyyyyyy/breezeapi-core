import { apiRequest, apiResponse } from '@Types';

export default async function handler(req: apiRequest, res: apiResponse) {
    res.json({ message: 'This is a new route!' });
}
