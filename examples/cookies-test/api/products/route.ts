// Import stuff from zod
import { z } from 'zod';

// Import types
import type { apiRequest, apiResponse, apiNext } from '@Types';

// OpenAPI Metadata
// Developers can provide custom metadata to enrich the docs.
export const openapi = {
    get: {
        summary: 'Get Product Details',
        description:
            'Retrieves the details of a product by its ID. Optionally accepts a search parameter.',
        tags: ['Product'],
        operationId: 'getProductDetails',
    },
};


// Route-Specific Middleware
export const middleware = [
    async (req: apiRequest, res: apiResponse, next: apiNext) => {
        console.log('Product Detail Middleware');
        return next();
    },
];
export async function GET(req: apiRequest, res: apiResponse) {
    console.log('[GET] Cookie Test route invoked');

    // --- Reading Cookies using req.getCookie ---
    const userId = req.getCookie('user_id'); // Use the new method
    const theme = req.getCookie('theme') || 'not set'; // Use the new method
    const testCookie = req.getCookie('X-eSportsApp-Token'); // Use the new method

    // You can also access the full map if needed:
    // const allCookiesMap = req.parsedCookies;
    // console.log("All parsed cookies Map:", allCookiesMap);

    console.log('Cookies received (via req.getCookie):', { userId, theme, testCookie });
    console.log('Raw Cookie Header:', req.headers.get('cookie'));

    return res.json({
        message: 'Reading cookies (via req.getCookie)',
        readValues: {
            userId: userId || 'Not Found',
            theme: theme,
            testCookie: testCookie || 'Not Found'
        }
    });
}

// POST: Set a test cookie
export async function POST(req: apiRequest, res: apiResponse) {
    console.log('[POST] Cookie Test route invoked');

    const cookieValue = `test_value_${Date.now()}`;
    const themeValue = 'test'; // Example value

    // Set a simple test cookie using Bun's native API via your wrapper
        res.cookie('test_cookie', cookieValue, {
            httpOnly: true,
            path: '/',
            maxAge: 60 * 15,
            // Add attributes for cross-origin:
            secure: true, // Requires HTTPS
            sameSite: 'none',
        });
    
        res.cookie('theme', themeValue, {
            path: '/',
            maxAge: 60 * 60 * 24 * 30,
            // Add attributes for cross-origin:
            secure: true, // Requires HTTPS
            sameSite: 'none',
        });
     
    console.log(`Setting cookies: test_cookie=${cookieValue}, theme=${themeValue}`);

    // Bun automatically adds Set-Cookie headers to the response
    return res.json({
        message: 'Cookies set',
        set: {
            test_cookie: cookieValue,
            theme: themeValue
        }
    });
}

// DELETE: Delete the test cookie
export async function DELETE(req: apiRequest, res: apiResponse) {
    console.log('[DELETE] Cookie Test route invoked');

    // Delete the test cookie
    req.cookies?.delete('test_cookie', {
        path: '/', // Must match the path used when setting
    });

    // Optionally delete others
    // req.cookies?.delete('theme', { path: '/' });

    console.log('Deleting cookie: test_cookie');

    // Bun automatically adds Set-Cookie header for deletion
    return res.json({
        message: 'test_cookie deleted (if it existed with path /)',
    });
}