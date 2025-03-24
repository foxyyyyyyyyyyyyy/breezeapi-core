
## 📚 Table of Contents

-   [Overview](#-overview)
-   [Features](#-features)
    -   [Core Features](#core-features)
-   [Changelog](#-changelog)
-   [What's Coming Next](#-whats-coming-next)
-   [Installation](#-installation)
-   [How to Use eSportsApp-api](#-how-to-use-eSportsApp-api)
    -   [Basic Usage Example](#basic-usage-example)
    -   [Project Structure](#recommended-project-structure)
    -   [Implementation Examples](#example-implementation)
    -   [File-Based Routing](#file-based-routing-examples)
    -   [Page Directory Usage](#page-directory-structure)
    -   [Route Examples](#route-file-example)
-   [API Documentation](#api-documentation-endpoints)
-   [Contributing](#-contributing)
-   [License](#-license)
-   [FAQs & Resources](#-faqs--additional-resources)

## 🚀 Overview
 - fork of burger api but only looking for api use and not for the all in one but nothing fully stuff.

## ✨ Features

### Core Features

-   ⚡ **Bun-Native HTTP Server:**  
    Built on Bun's native APIs for exceptional performance.

-   📁 **File-Based Routing Engine:**  
    Automatically scans directories to register routes.

    -   Supports dynamic routes via folder names like `[id]` for
        `/api/product/:id`.

-   🛠️ **Request & Response Enhancements:**

    -   `apiRequest` extends the native Request to include query, params, and
        validated data.
    -   `apiResponse` provides methods to set headers, status, and build
        responses (JSON, text, HTML, redirects, files).

-   🔄 **Middleware System:**

    -   **Global Middleware:** Runs on every request.
    -   **Route-Specific Middleware:** Defined in individual route files.
    -   **Validation Middleware:** Automatically validates request data using
        Zod schemas exported from routes.

-   ✅ **Zod-Based Schema Validation:**  
    Automatically validates request params, query, and body using Zod.

    -   Supports preprocessing (e.g., converting URL parameters from string to
        number).

-   📚 **Automatic OpenAPI Specification Generation:**  
    Generates an OpenAPI 3.0 document using route metadata and Zod schemas.

    -   **OpenAPI Options:**
        -   Global metadata (title, description, version)
        -   Per-route metadata (summary, description, tags, operationId,
            deprecated, externalDocs)
        -   Auto-generated parameters and requestBody schemas (using
            `zod-to-json-schema` for detailed inline JSON schema definitions)

-   🔍 **Swagger UI Integration:**  
    Provides a `/docs` endpoint serving an interactive Swagger UI that reads
    from `/openapi.json`.

## 📣 Changelog

For detailed release notes, please refer to the [Changelog](CHANGELOG.md) file.

### Version 0.1.3 (March 15, 2024)

-   🔄 **Bug Fixes and Improvements:**
    -   Enhanced page routing and server response handling
    -   Improved import paths configuration in tsconfig.json
    -   Updated request/response handling
    -   Enhanced server initialization process
    -   Improved native types handling
    -   Updated server response functionality

## 🎯 What's Coming Next?

We're actively enhancing eSportsApp-api with powerful new features:

### 🎨 Page Serving Enhancements (In Development)

-   🔥 **TSX Support:** Adding React/TSX rendering capabilities
-   🔐 **Global Middleware:** Applies to all routes for tasks like logging and
    authentication.
-   🔐 **Page-Specific Middleware:** Defined in individual route files for
    tailored processing.
-   🛠️ **Advanced Middleware:** More built-in middleware for common use cases:
    -   CORS handling
    -   Rate limiting
    -   Request logging
    -   Security headers
-   🎯 **Performance Optimizations:** Further leveraging Bun's capabilities for
    faster page serving

Stay tuned for updates as we continue to build and improve eSportsApp-api! We're
committed to making it the best API framework for Bun.js.

## 📦 Installation

Install eSportsApp-api via bun:

```bash
bun add eSportsApp-api
```

## 🚀 How to Use eSportsApp-api

### **Basic Usage Example**

```ts
import { eSportsApp } from 'eSportsApp-api';

// Global middleware example: a simple logger.
const globalLogger = async (req, res, next) => {
    console.log(`[Global Logger] ${req.method} ${req.url}`);
    return next();
};

const eSportsApp = new API({
    title: 'My Custom API',
    description: 'Custom API with auto-generated docs and validation',
    apiDir: 'api',
    globalMiddleware: [globalLogger],
    version: '1.0.0',
    debug: true, // Enable debug mode for detailed logging and stack trace page
});

// Start the server on port 4000 with a callback
eSportsApp.serve(4000, (port) => {
    console.log(`Server is running on port ${port}`);
});
```

The `debug` option enables:

-   🔍 Interactive stack trace page at when errors occur
    -   Shows detailed error information
    -   Displays the full stack trace
    -   Highlights the exact line where the error occurred
    -   Provides request context and environment details

This is particularly useful during development to understand how your API is
working and troubleshoot issues.

### **Recommended Project Structure**

Here's a recommended project structure that helps keep your code organized and
maintainable:

```
my-api/
├── src/
│   ├── api/                    # API routes
│   │   ├── products/
│   │   │   ├── route.ts       # Product routes
│   │   │   └── [id]/
│   │   │       └── route.ts   # Product detail routes
│   │   └── users/
│   │       └── route.ts       # User routes
│   ├── middleware/            # Middleware
│   │   ├── global/           # Global middleware
│   │   │   ├── logger.ts
│   │   │   └── auth.ts
│   │   └── routes/           # Route-specific middleware
│   │       ├── products.ts
│   │       └── users.ts
│   ├── schemas/              # Zod schemas
│   │   ├── product.ts
│   │   └── user.ts
│   ├── utils/               # Utility functions
│   │   ├── errors.ts
│   │   └── helpers.ts
│   └── index.ts             # Main application file
├── package.json
└── tsconfig.json
```

### **Example Implementation**

Here's how to implement this structure:

1. **Global Middleware** (`src/middleware/global/logger.ts`):

```ts
import type { apiRequest, apiResponse, apiNext } from 'eSportsApp-api';

export const logger = async (
    req: apiRequest,
    res: apiResponse,
    next: apiNext
) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    return next();
};
```

2. **Route-Specific Middleware** (`src/middleware/routes/products.ts`):

```ts
import type { apiRequest, apiResponse, apiNext } from 'eSportsApp-api';

export const validateProductAccess = async (
    req: apiRequest,
    res: apiResponse,
    next: apiNext
) => {
    // Your middleware logic here
    return next();
};
```

3. **Schemas** (`src/schemas/product.ts`):

```ts
import { z } from 'zod';

export const productSchema = {
    create: z.object({
        name: z.string().min(1),
        price: z.number().positive(),
        description: z.string().optional(),
    }),
    update: z.object({
        name: z.string().min(1).optional(),
        price: z.number().positive().optional(),
        description: z.string().optional(),
    }),
};
```

4. **Route File** (`src/api/products/route.ts`):

```ts
import type { apiRequest, apiResponse } from 'eSportsApp-api';
import { validateProductAccess } from '../../middleware/routes/products';
import { productSchema } from '../../schemas/product';

export const middleware = [validateProductAccess];
export const schema = {
    post: {
        body: productSchema.create,
    },
    put: {
        body: productSchema.update,
    },
};

export async function GET(req: apiRequest, res: apiResponse) {
    return res.json({ message: 'List of products' });
}

export async function POST(req: apiRequest, res: apiResponse) {
    const body = req.validated?.body;
    return res.json({ message: 'Product created', data: body });
}
```

5. **Main Application** (`src/index.ts`):

```ts
import { eSportsApp } from 'eSportsApp-api';
import { logger } from './middleware/global/logger';

const eSportsApp = new API({
    title: 'Product API',
    description: 'API for managing products',
    apiDir: 'api',
    globalMiddleware: [logger],
    version: '1.0.0',
});

eSportsApp.serve(4000, (port) => {
    console.log(`Server is running on port ${port}`);
});
```

This structure provides several benefits:

-   🎯 Clear separation of concerns
-   📁 Easy to find and maintain code
-   🔄 Reusable components
-   🧹 Clean and organized codebase
-   📚 Better scalability

### **File-Based Routing Examples**

-   📄 **Static API Route:**  
    Place a file at `src/api/route.ts` to handle the root API endpoint (e.g.,
    `/api`).

-   🔄 **Dynamic API Route:**  
    For routes with dynamic segments, create folders with square brackets. For
    example:
    ```
    src/api/product/
    ├── route.ts         // Handles /api/product
    └── [id]/
        └── route.ts     // Handles /api/product/:id
    ```

### **Page Directory Structure**

eSportsApp-api supports serving static pages alongside your API routes. Here's how
to use the `pageDir` feature:

```ts
const eSportsApp = new API({
    title: 'My Custom API',
    description: 'Custom API with auto-generated docs and validation',
    apiDir: 'api',
    pageDir: 'pages', // Enable page serving from the pages directory
    globalMiddleware: [globalLogger],
    version: '1.0.0',
});
```

#### **Page Directory Structure Example:**

```
my-api/
├── src/
│   ├── pages/                  # Pages directory
│   │   ├── index.html         # Home page (/)
│   │   ├── about.html         # About page (/about)
│   │   └── products/
│   │       ├── index.html     # Products list (/products)
│   │       └── [id]/          # Dynamic product pages
│   │           └── index.html # Single product (/products/123)
│   └── api/                   # Your API routes
```

#### **Page Routing Features:**

-   📄 **Index Pages:** Files named `index.html` serve as directory index pages
-   🔄 **Clean URLs:**
    -   `/pages/about.html` → `/about`
-   📁 **Dynamic Routes:** Use `[param]` syntax in folder names
    -   `/pages/products/[id]/index.html` → `/products/:id`
-   🎯 **Route Grouping:** Use `(group)` syntax for logical grouping
    -   `/pages/(auth)/login.html` → `/login`
    -   `/pages/(auth)/register.html` → `/register`

#### **Example Page Structure:**

```html
<!-- pages/products/[id]/index.html -->
<!DOCTYPE html>
<html>
    <head>
        <title>Product Details</title>
    </head>
    <body>
        <h1>Product Details</h1>
        <!-- Content here -->
    </body>
</html>
```

### **Route File Example**

Below is an example route file demonstrating schema validation, route-specific
middleware, and OpenAPI metadata.

```ts
// examples/demo/api/product/[id]/route.ts

import { z } from 'zod';
import type { apiRequest, apiResponse, apiNext } from 'eSportsApp-api';

// OpenAPI metadata for this route
export const openapi = {
    get: {
        summary: 'Get Product Details',
        description: 'Retrieves product details by product ID.',
        tags: ['Product'],
        operationId: 'getProductDetails',
    },
};

// Validation Schemas for GET and POST requests
export const schema = {
    get: {
        params: z.object({
            id: z.preprocess(
                (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
                z.number().min(1, 'ID is required')
            ),
        }),
        query: z.object({
            search: z.string().optional(),
        }),
    },
    post: {
        body: z.object({
            name: z.string().min(1, 'Name is required'),
            price: z.number().positive('Price must be positive'),
        }),
    },
};

// Route-specific middleware
export const middleware = [
    async (req: apiRequest, res: apiResponse, next: apiNext) => {
        console.log('[Product Middleware] Executing product route middleware');
        return next();
    },
];

// GET handler: returns product details
export async function GET(
    req: apiRequest,
    res: apiResponse,
    params: { id: number }
) {
    console.log('[GET] Product route invoked');
    const validatedParams = (req.validated?.params as { id: number }) || params;
    const query =
        req.validated?.query || Object.fromEntries(req.query.entries());
    return res.json({
        id: validatedParams.id,
        query,
        name: 'Sample Product',
    });
}

// POST handler: creates a new product
export async function POST(req: apiRequest, res: apiResponse) {
    console.log('[POST] Product route invoked');
    const body = req.validated?.body || (await req.json());
    return res.json(body);
}
```

### **API Documentation Endpoints**

-   📚 **OpenAPI JSON:**  
    Access `http://localhost:4000/openapi.json` to view the auto-generated
    OpenAPI specification.

-   🔍 **Swagger UI:**  
    Access `http://localhost:4000/docs` to view interactive API documentation
    via Swagger UI.

## 🤝 Contributing

We welcome contributions from the community! If you have suggestions or
improvements, please open an issue or submit a pull request. Let's build
something amazing together.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.

The MIT License is a permissive license that is short and to the point. It lets
people do anything they want with your code as long as they provide attribution
back to you and don't hold you liable.

## ❓ FAQs & Additional Resources

-   🔄 **How do I add custom middleware?**  
    You can pass an array of global middleware in the eSportsApp options or export
    route-specific middleware in your route files.

-   📁 **How does file-based routing work?**  
    Place your route files under `src/api/` or just `/api` using folder and file
    naming conventions (e.g., `[id]` for dynamic routes).

-   ✅ **How is validation handled?**  
    eSportsApp-api uses Zod for schema validation. Define your schemas in your route
    files and they are automatically used to validate incoming requests.

-   📚 **How can I customize the OpenAPI documentation?**  
    Override the default auto-generated summaries, descriptions, tags, and
    operationIds by exporting an `openapi` object in your route files.

_eSportsApp-api_ aims to revolutionize your API development experience with
simplicity, speed, and cutting-edge features. Happy coding! 🚀
