# @alt-javascript/boot-azure-function

[![Language](https://img.shields.io/badge/language-JavaScript-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![npm version](https://img.shields.io/npm/v/%40alt-javascript%2Fboot-azure-function)](https://www.npmjs.com/package/@alt-javascript/boot-azure-function)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml/badge.svg)](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml)

Azure Functions adapter for the `@alt-javascript` framework. Handles Azure Functions v4 HTTP trigger requests with CDI-managed controllers and a CDI middleware pipeline for cross-cutting concerns.

**Part of the [@alt-javascript](https://github.com/alt-javascript/boot) monorepo.**

## Install

```bash
npm install @alt-javascript/boot-azure-function
```

## Usage

```javascript
// function/handler.js
import { Boot } from '@alt-javascript/boot';
import { Context, Singleton } from '@alt-javascript/cdi';
import { azureFunctionStarter } from '@alt-javascript/boot-azure-function';
import { TodoService } from './services.js';
import { TodoController } from './controllers.js';

const context = new Context([
  ...azureFunctionStarter(),
  new Singleton(TodoService),
  new Singleton(TodoController),
]);

const appCtxPromise = Boot.boot({ contexts: [context], run: false });

export async function handler(request, invocationContext) {
  const appCtx = await appCtxPromise;
  return appCtx.get('azureFunctionAdapter').handle(request, invocationContext);
}
```

## Controller Convention

```javascript
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
```

Handlers return a plain object (200), `{ statusCode, body }` (explicit), or `null` / `undefined` (204). The adapter returns Azure Functions v4 `HttpResponseInit`: `{ status, jsonBody, headers }`.

## Middleware Pipeline

`azureFunctionStarter()` registers three built-in middleware components:

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
| `middleware.requestLogger.enabled` | `true` | Enable request logging |
| `middleware.errorHandler.enabled` | `true` | Enable error handler |
| `middleware.notFound.enabled` | `true` | Enable 404 handler |

## License

MIT
