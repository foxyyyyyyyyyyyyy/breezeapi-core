import type { apiNext, apiRequest, apiResponse } from "@Types";

export const cookieParseMiddleware = async (req: apiRequest, res: apiResponse, next: () => Promise<Response>) => {
    // Parse cookies
    const cookie = req.headers.get('cookie');
    if (cookie) {
      req.cookies = Object.fromEntries(
        cookie.split('; ').map((x) => x.split('='))
      );
      req.hascookies = true;
    } else {
        req.hascookies = false;
    }
    return next();
  };