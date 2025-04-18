# BreezeAPI Middleware & Guards Guide

## Overview

BreezeAPI provides a flexible middleware system inspired by Express, supporting:

- **Global Middleware:** Runs on every request.
- **Route-Specific Middleware:** Runs only for a specific route, and can be method-specific.
- **Guards:** Special middleware that can block/disallow a request before it reaches route middleware or handlers.

---

## 1. What is Middleware?

A middleware is an async function with the signature:

```ts
async function middleware(req, res, next) {
    // Do something with req/res
    return next(); // Call next middleware or handler
}
```

- `req`: The request object (extends Bun's Request, includes `.params`, `.query`, etc.).
- `res`: The response object (provides `.json()`, `.status()`, `.header()`, etc.).
- `next`: A function to call the next middleware in the chain.

You can also use **middleware factories** to pass options:

```ts
function cachingMiddleware(options) {
    return async (req, res, next) => {
        // Use options.duration, etc.
        return next();
    };
}
```

---

## 2. Global Middleware

Global middleware runs on **every request** (all routes).

### How to Register

You can register global middleware in two ways:

#### a) In the constructor (legacy, still supported):

```ts
const api = new BreezeAPI({
    apiDir: 'src/api',
    globalMiddleware: [loggerMiddleware, corsMiddleware],
});
```

#### b) Using `.use()` (recommended, Express-style):

```ts
api.use(loggerMiddleware);
api.use(corsMiddleware);
api.use(cachingMiddleware({ duration: '1h' }));
```

You can chain `.use()` calls:

```ts
api.use(mw1).use(mw2);
```

---

## 3. Route-Specific Middleware

Route-specific middleware only runs for a particular route, and can be **method-specific**.

### How to Register

#### a) Method-specific middleware via `config` (recommended):

```ts
// src/api/products/route.ts
import { cachingMiddleware } from '@middleware/caching';

export const config = {
    get: {
        middleware: [
            cachingMiddleware({ duration: '3d' }),
        ],
    },
    post: {
        middleware: [
            // POST-specific middleware
        ],
    },
};
```

#### b) All-method middleware via `config.middleware`:

```ts
export const config = {
    middleware: [
        loggerMiddleware,
        cachingMiddleware({ duration: '1d' }),
    ],
};
```

#### c) Legacy: Export a `middleware` array from your route file:

```ts
export const middleware = [
    async (req, res, next) => {
        // Custom logic
        return next();
    },
];
```

**Order of precedence:**  
1. `config[method].middleware` (e.g., `config.get.middleware`)
2. `config.middleware`
3. `middleware` export

---

## 4. Guards

**Guards** are like middleware but are intended to block/disallow requests before route middleware or handlers run.

- If a guard "fails", it should send a response and **not call `next()`**.

### How to Register

#### a) In the `config` export of your route file:

```ts
// src/api/products/route.ts
import { authGuard } from '@guards';

export const config = {
    guards: [
        authGuard, // Simple guard
        // or named/configurable:
        // { handler: roleGuard, options: { requiredRoles: ['admin'] } }
    ],
};
```

- Guards run **before** route middleware and handlers.
- If any guard does not call `next()`, the request is blocked.

---

## 5. Creating Middleware & Guards

### Middleware Example

```ts
// src/middleware/logger.ts
export const loggerMiddleware = async (req, res, next) => {
    console.log(`[${req.method}] ${req.url}`);
    return next();
};
```

### Middleware Factory Example

```ts
export function cachingMiddleware(options) {
    return async (req, res, next) => {
        // Use options.duration, etc.
        return next();
    };
}
```

### Guard Example

```ts
// src/guards/authGuard.ts
export const authGuard = async (req, res, next) => {
    if (!req.headers.get('authorization')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    return next();
};
```

### Configurable Guard Example

```ts
export const roleGuard = async (req, res, next, options) => {
    const userRole = req.headers.get('x-role');
    if (!options.requiredRoles.includes(userRole)) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    return next();
};

// Usage in config:
export const config = {
    guards: [
        { handler: roleGuard, options: { requiredRoles: ['admin', 'super-admin'] } }
    ]
};
```

---

## 6. Execution Order

For each request, the order is:

1. **Guards** (from route `config.guards`)
2. **Route-specific middleware** (`config[method].middleware`, `config.middleware`, or `middleware` export)
3. **Validation middleware** (if a Zod `schema` is exported)
4. **Global middleware** (from `.use()` or `globalMiddleware`)
5. **Route handler** (`GET`, `POST`, etc.)

If any middleware or guard does **not** call `next()`, the chain stops and the response is sent.

---

## 7. Example Route File

```ts
// src/api/products/route.ts
import { loggerMiddleware } from '@middleware/logger';
import { cachingMiddleware } from '@middleware/caching';
import { authGuard } from '@guards/authGuard';

export const config = {
    guards: [authGuard],
    get: {
        middleware: [
            loggerMiddleware,
            cachingMiddleware({ duration: '3d' }),
        ],
    },
    post: {
        middleware: [
            loggerMiddleware,
        ],
    },
};

export async function GET(req, res) {
    return res.json({ message: 'Products list' });
}
```

---

## 8. FAQ

- **How do I add global middleware?**  
  Use `.use()` or the `globalMiddleware` option in the constructor.

- **How do I add route-specific middleware?**  
  Use `config[method].middleware`, `config.middleware`, or export a `middleware` array in your route file.

- **How do I add guards?**  
  Use `config.guards` in your route file.

- **How do I stop a request in middleware/guard?**  
  Do **not** call `next()`. Instead, send a response (e.g., `return res.status(401).json({ error: 'Unauthorized' })`).

---

## 9. Further Reading

- See [README.md](../README.md) for more features and examples.
- Explore the `examples/` directory for real-world usage.

---