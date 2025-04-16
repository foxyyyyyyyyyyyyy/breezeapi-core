# Breeze API Documentation

## Overview

**Breeze API** is a Bun-native, file-based API framework with built-in support for HTTP and WebSocket routes, Zod-based validation, OpenAPI/Swagger documentation, and a flexible middleware system. It is designed for rapid development, scalability, and developer ergonomics.

---

## Features

- **File-Based Routing:**  
  Organize your API and WebSocket endpoints using folders and files. Dynamic routes are supported via `[param]` syntax.

- **Middleware System:**  
  - *Global Middleware*: Runs on every request.
  - *Route-Specific Middleware*: Defined per route file.
  - *Validation Middleware*: Auto-generated from Zod schemas.

- **Zod Validation:**  
  Validate `params`, `query`, and `body` using Zod schemas. Errors are automatically handled.

- **OpenAPI & Swagger UI:**  
  Auto-generates OpenAPI 3.0 docs and serves Swagger UI at `/docs`.

- **WebSocket Routing:**  
  File-based WebSocket endpoints with group management and event handlers.

---

## Project Structure

```
my-api/
├── src/
│   ├── api/                    # HTTP API routes
│   │   ├── products/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   └── users/
│   │       └── route.ts
│   ├── socket/                 # WebSocket routes (optional)
│   │   └── chat/
│   │       └── socket.ts
│   ├── middleware/             # Middleware
│   │   ├── global/
│   │   │   └── logger.ts
│   │   └── routes/
│   │       └── products.ts
│   ├── schemas/                # Zod schemas
│   │   └── product.ts
│   └── index.ts                # App entrypoint
```

---

## Routing

### HTTP Routes

- Place route files under `src/api/`.
- Use `route.ts` for static routes and `[param]/route.ts` for dynamic segments.
- Export HTTP method handlers (`GET`, `POST`, etc.), `schema`, `middleware`, and `openapi` metadata.

**Example: `src/api/products/[id]/route.ts`**
```ts
import { z } from 'zod';
import type { apiRequest, apiResponse } from 'eSportsApp-api';

export const schema = {
  get: {
    params: z.object({ id: z.string().min(1) }),
    query: z.object({ search: z.string().optional() }),
  },
};

export async function GET(req: apiRequest, res: apiResponse) {
  return res.json({ id: req.params.id });
}
```

### WebSocket Routes

- Place socket files under `src/socket/`.
- Use `socket.ts` for each endpoint.
- Export a `handler` object with `open`, `message`, `close`, and `drain` methods.

**Example: `src/socket/chat/socket.ts`**
```ts
import { WebSocketHandler } from 'eSportsApp-api';

export const handler: WebSocketHandler = {
  open(ws, id) {
    console.log(`WebSocket opened: ${id}`);
  },
  message(ws, message, id) {
    ws.send(`Echo: ${message}`);
  },
  close(ws, code, reason, id) {
    console.log(`Closed: ${id}`);
  },
};
```

---

## Middleware

### Global Middleware

- Passed in the API constructor via `globalMiddleware`.
- Runs on every request.

**Example: `src/middleware/global/logger.ts`**
```ts
export const logger = async (req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  return next();
};
```

### Route-Specific Middleware

- Export a `middleware` array from your route file.
- Runs only for that route.

**Example:**
```ts
export const middleware = [
  async (req, res, next) => {
    // Custom logic
    return next();
  },
];
```

---

## Validation

- Define a `schema` export in your route file using Zod.
- The framework validates `params`, `query`, and `body` automatically.
- Validation errors return a 400 response with details.

**Example:**
```ts
import { z } from 'zod';
export const schema = {
  post: {
    body: z.object({
      name: z.string().min(1),
      price: z.number().positive(),
    }),
  },
};
```

---

## OpenAPI & Swagger UI

- Add an `openapi` export to your route file for custom docs metadata.
- Access `/openapi.json` for the OpenAPI spec.
- Access `/docs` for Swagger UI.

**Example:**
```ts
export const openapi = {
  get: {
    summary: 'Get Product',
    description: 'Returns product details.',
    tags: ['Product'],
  },
};
```

---

## CLI Templates

- See `cli/templates/route-example.ts` and `cli/templates/socket-template.ts` for ready-to-use route and socket templates.
- Use these as a starting point for your own endpoints.

---

## Usage Example

**Entrypoint: `src/index.ts`**
```ts
import { API } from 'eSportsApp-api';
import { logger } from './middleware/global/logger';

const eSportsApp = new API({
  title: 'My API',
  apiDir: 'src/api',
  socketDir: 'src/socket',
  globalMiddleware: [logger],
  version: '1.0.0',
  debug: true,
});

eSportsApp.serve(4000, () => {
  console.log('Server running on port 4000');
});
```

---

## FAQ

- **How do I add middleware?**  
  Use `globalMiddleware` in the API options or export `middleware` from route files.

- **How does validation work?**  
  Define a `schema` export using Zod. The framework validates and attaches the result to `req.validated`.

- **How do I add WebSocket endpoints?**  
  Place `socket.ts` files in `src/socket/` and export a `handler` object.

- **How do I customize OpenAPI docs?**  
  Export an `openapi` object from your route file.

---

## Further Reading

- See the `README.md` for more advanced usage, features, and roadmap.
- Explore the `examples/` directory for real-world implementations.

---
