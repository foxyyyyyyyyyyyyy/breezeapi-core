// Import eSportsApp
import { API } from '@src';

// Create a new API instance
const eSportsApp = new API({
    title: 'eSportsApp API',
    description: 'A simple API for serving your data',
});

// Start the server
eSportsApp.serve(4000, () => {
    console.log(`✨ Server is running on port: 4000`);
});
