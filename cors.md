# CORS Settings in BreezeAPI

BreezeAPI provides flexible CORS (Cross-Origin Resource Sharing) configuration to control which origins, methods, and headers are allowed in cross-origin requests.

## Basic Usage

You can configure CORS via the `cors` property in the `ServerOptions` passed to the `BreezeAPI` constructor:

```typescript
const api = new BreezeAPI({
  cors: {
    origin: ['https://example.com', 'https://another.com'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-Custom-Header'],
    credentials: true,
    maxAge: 3600,
  }
});
```

## Always Allowed Headers

By default, BreezeAPI always includes the `api-key` header in `Access-Control-Allow-Headers`.  
You can customize this by passing the `alwaysAllowedHeaders` option:

```typescript
const api = new BreezeAPI({
  cors: { /* ... */ },
  alwaysAllowedHeaders: ['api-key', 'x-another-header']
});
```

This ensures these headers are always included in CORS responses, in addition to any you specify in `allowedHeaders`.

## CORS Options Reference

| Option               | Type                       | Default                                      | Description                                      |
|----------------------|---------------------------|----------------------------------------------|--------------------------------------------------|
| `origin`             | `string \| string[] \| true` | `'*'`                                         | Allowed origins. Use `true` for all origins.     |
| `methods`            | `string \| string[]`       | `'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS'`   | Allowed HTTP methods.                            |
| `allowedHeaders`     | `string \| string[]`       | `'Content-Type, Authorization'`               | Allowed request headers.                         |
| `exposedHeaders`     | `string \| string[]`       | `''`                                         | Headers exposed to the browser.                  |
| `credentials`        | `boolean`                  | `true`                                       | Allow credentials (cookies, etc).                |
| `maxAge`             | `number`                   | `86400`                                      | How long the results of a preflight request can be cached. |
| `alwaysAllowedHeaders` | `string[]`               | `['api-key']`                                | Headers always included in `Access-Control-Allow-Headers`. |

## Example: Customizing Allowed Headers

```typescript
const api = new BreezeAPI({
  cors: {
    allowedHeaders: ['Content-Type', 'Authorization', 'x-custom'],
  },
  alwaysAllowedHeaders: ['api-key', 'x-another-header']
});
```

This will result in the following `Access-Control-Allow-Headers`:

```
Content-Type, Authorization, x-custom, api-key, x-another-header
```

## Notes

- If you want to remove `api-key` from the always allowed headers, set `alwaysAllowedHeaders: []`.
- All CORS settings can be customized per your application's requirements.

