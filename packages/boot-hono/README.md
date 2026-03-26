# @alt-javascript/boot-hono

[![Language](https://img.shields.io/badge/language-JavaScript-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![npm version](https://img.shields.io/npm/v/%40alt-javascript%2Fboot-hono)](https://www.npmjs.com/package/@alt-javascript/boot-hono)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml/badge.svg)](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml)

Hono adapter for the `@alt-javascript` framework. Bridges CDI-managed controllers to Hono's Web Standards routing with a CDI middleware pipeline for cross-cutting concerns.

Hono supports Node.js, Bun, Deno, and Cloudflare Workers via the same codebase.

**Part of the [@alt-javascript](https://github.com/alt-javascript/boot) monorepo.**

## Install

```bash
npm install @alt-javascript/boot-hono hono
# For Node.js:
npm install @hono/node-server
```

## Usage

```javascript
import { Boot } from '@alt-javascript/boot';
import { Context, Singleton } from '@alt-javascript/cdi';
import { honoStarter } from '@alt-javascript/boot-hono';

class TodoController {
  static __routes = [
    { method: 'GET',  path: '/todos',     handler: 'list'   },
    { method: 'POST', path: '/todos',     handler: 'create' },
    { method: 'GET',  path: '/todos/:id', handler: 'get'    },
  ];

  constructor() { this.todoService = null; } // autowired

  async list(request)   { return this.todoService.findAll(); }
  async create(request) { return this.todoService.create(request.body); }
  async get(request)    { return this.todoService.findById(request.params.id); }
}

const context = new Context([
  ...honoStarter(),
  new Singleton(TodoService),
  new Singleton(TodoController),
]);

await Boot.boot({ contexts: [context] });
```

Controllers receive a normalised request object `{ params, query, headers, body, ctx, honoCtx }`. Return a plain object for a 200 JSON response, or `{ statusCode, body }` for explicit status control.

## Middleware Pipeline

`honoStarter()` registers three built-in middleware components automatically:

| Component | Order | Behaviour |
|---|---|---|
| `RequestLoggerMiddleware` | 10 | Logs `[METHOD] /path → status (Xms)` |
| `ErrorHandlerMiddleware` | 20 | Converts thrown errors to JSON error responses |
| `NotFoundMiddleware` | 30 | Returns 404 for unmatched routes |

Add custom middleware by declaring `static __middleware = { order: N }`:

```javascript
class AuthMiddleware {
  static __middleware = { order: 5 };

  async handle(request, next) {
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (!token) return { statusCode: 401, body: { error: 'Unauthorized' } };
    return next({ ...request, user: { token } });
  }
}
```

## Configuration

| Key | Default | Description |
|---|---|---|
| `server.port` | `3000` | Port to listen on |
| `server.host` | `0.0.0.0` | Host to bind |
| `middleware.requestLogger.enabled` | `true` | Enable request logging |
| `middleware.errorHandler.enabled` | `true` | Enable error handler |
| `middleware.notFound.enabled` | `true` | Enable 404 handler |

## Testing

Use `app.request()` for testing without a network:

```javascript
const app = appCtx.get('honoAdapter').app;
const response = await app.request('/todos');
assert.equal(response.status, 200);
```

## License

MIT
