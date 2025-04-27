# Breeze API Documentation

## Overview

**Breeze API** is a Bun-native, file-based API framework with built-in support for HTTP and WebSocket routes, Zod-based validation, OpenAPI/Swagger documentation, flexible middleware, and first-class cookie and CORS support. It is designed for rapid development, scalability, and developer ergonomics.

---

## Features

- **File-Based Routing:**  
  Organize your API and WebSocket endpoints using folders and files. Dynamic routes are supported via `[param]` syntax.

- **Middleware System:**  
  - *Global Middleware*: Runs on every request.
  - *Route-Specific Middleware*: Defined per route file.
  - *Validation Middleware*: Auto-generated from Zod schemas.
  - *Configurable Middleware/Guards*: Pass options to middleware/guards via route config.

- **Zod Validation:**  
  Validate `params`, `query`, and `body` using Zod schemas. Errors are automatically handled.

- **OpenAPI & Swagger UI:**  
  Auto-generates OpenAPI 3.0 docs and serves Swagger UI at `/docs`.

- **WebSocket Routing:**  
  File-based WebSocket endpoints with group management and event handlers.

- **CORS Support:**  
  Fine-grained CORS configuration per API instance, including allowed origins, headers, credentials, and max age.

- **Cookie Support:**  
  Native Bun-style cookie API (`req.cookies.get/set/delete`) for all API routes when enabled.

- **SSE (Server-Sent Events):**  
  Built-in support for SSE endpoints with CORS and streaming helpers.

- **Global Config Registry:**  
  Register and retrieve global config for plugins/middleware via `BreezeAPI.config()`.

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

#### Cookie Support in Routes

If you enable `cookie: true` in your API options, every `req` object in your route handlers will have a Bun-style `cookies` property:

```ts
export async function POST(req, res) {
  // Read a cookie
  const token = req.cookies.get("X-eSportsApp-Token");

  // Set a cookie
  req.cookies.set("X-eSportsApp-Token", "your-jwt-token", {
    httpOnly: true,
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  // Delete a cookie
  req.cookies.delete("X-eSportsApp-Token", { path: "/" });

  return res.json({ ok: true });
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

### Configurable Middleware and Guards

You can define middleware and guards with configuration options in your route's `config` export:

```ts
export const config = {
  middleware: {
    auth: {
      handler: myAuthMiddleware,
      options: { role: "admin" },
    },
  },
  guards: [
    myGuardMiddleware,
  ],
};
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

## CORS

You can configure CORS globally for your API:

```ts
import { BreezeAPI } from 'eSportsApp-api';

const api = new BreezeAPI({
  // ...other options...
  cors: {
    origin: ["https://myapp.com", "http://localhost:3000"],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "api-key"],
    credentials: true,
    maxAge: 86400,
  },
});
```

You can also specify headers that are always allowed (e.g., `api-key`) via `alwaysAllowedHeaders`.

---

## SSE (Server-Sent Events)

To create an SSE endpoint, export a `SSE` or `sse` handler in your route file:

```ts
export async function SSE(req, res, send) {
  send({ message: "Hello SSE!" });
  // ...send more events as needed...
}
```

SSE routes automatically set appropriate headers and support CORS (with optional `sseCors` config).

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

## Global Config Registry

You can register and retrieve global config for plugins/middleware:

```ts
import { BreezeAPI } from 'eSportsApp-api';

// Set a config value
BreezeAPI.config("myPlugin", { enabled: true });

// Get a config value
const pluginConfig = BreezeAPI.config("myPlugin");
```

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

- **How do I use cookies in my routes?**  
  Enable `cookie: true` in your API options. Then use `req.cookies.get/set/delete` in your handlers.

- **How do I add configurable middleware or guards?**  
  Use the `config` export in your route file with middleware/guards as objects with `handler` and `options`.

- **How do I enable CORS for SSE endpoints?**  
  Use the `sseCors` option in the API constructor.

- **How do I register global config for plugins?**  
  Use `BreezeAPI.config(key, value)` to set and `BreezeAPI.config(key)` to get.

- **How do I use the new BreezeAPI class?**  
  Use `BreezeAPI` instead of the deprecated `API` class.

---

## Further Reading

- See the `README.md` for more advanced usage, features, and roadmap.
- Explore the `examples/` directory for real-world implementations.

---
