// Import stuff from eSportsApp-api
import { eSportsApp, setDir } from '@src';

// Import middleware
import { globalLogger } from './middleware/logger';

// Create a new API instance with OpenAPI metadata and global middleware.
const eSportsApp = new API({
    title: 'Demo API',
    description:
        'This is a demo API demonstrating all available options in eSportsApp-api.',
    apiDir: setDir(__dirname, 'api'),
    globalMiddleware: [globalLogger],
    version: '1.0.0',
    debug: true,
});

// Start the server on port 4000, with a callback to log the startup.
eSportsApp.serve(4000, () => {
    console.log(`🚀 Server is running on port 4000`);
});
