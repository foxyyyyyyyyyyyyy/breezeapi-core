import type { apiRequest } from "@src/types";

export function getCookie(req: apiRequest, name: string) {
    if (req.cookies?.get) return req.cookies.get(name);
    // Fallback: parse from header
    const cookieHeader = req.headers?.get?.('cookie') || '';
    const cookies = Object.fromEntries(cookieHeader.split(';').map((c: string) => c.trim().split('=')));
    return cookies[name];
}

export function setCookie(req: any, name: string, value: string, options: any = {}) {
    if (req.cookies?.set) return req.cookies.set(name, value, options);

    // Fallback: set header directly on response
    const opts = {
        path: '/',
        ...options,
    };
    let cookie = `${name}=${encodeURIComponent(value)}`;
    if (opts.maxAge) cookie += `; Max-Age=${opts.maxAge}`;
    if (opts.domain) cookie += `; Domain=${opts.domain}`;
    if (opts.path) cookie += `; Path=${opts.path}`;
    if (opts.httpOnly) cookie += `; HttpOnly`;
    if (opts.secure) cookie += `; Secure`;
    if (opts.sameSite) cookie += `; SameSite=${opts.sameSite}`;

    // Set header on response (assumes req.res.header exists)
    if (req.res?.header) {
        req.res.header('Set-Cookie', cookie);
    }
}

export function deleteCookie(req: any, name: string, options: any = {}) {
    if (req.cookies?.delete) return req.cookies.delete(name, options);
    // Fallback: set cookie with expired date
    setCookie(req, name, '', { ...options, maxAge: 0 });
}