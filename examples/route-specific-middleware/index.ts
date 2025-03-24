// Import eSportsApp
import { eSportsApp, setDir } from '@src';
import { globalMiddleware1 } from './middleware';

// Create a new API instance
const eSportsApp = new API({
    title: 'eSportsApp API',
    description: 'A simple API for serving your data',
    apiDir: setDir(__dirname, 'api'),
    globalMiddleware: [globalMiddleware1],
});

// Start the server
eSportsApp.serve(4000, () => {
    console.log(`✨ Server is running on port: 4000`);
});
