# @alt-javascript/boot-lambda

[![Language](https://img.shields.io/badge/language-JavaScript-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![npm version](https://img.shields.io/npm/v/%40alt-javascript%2Fboot-lambda)](https://www.npmjs.com/package/@alt-javascript/boot-lambda)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml/badge.svg)](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml)

AWS Lambda adapter for the `@alt-javascript` framework. Handles API Gateway HTTP API v2 events with CDI-managed controllers and a CDI middleware pipeline for cross-cutting concerns.

CDI boots once on cold start and is reused on warm invocations — the same pattern as Spring's `ApplicationContext` in a serverless launcher.

**Part of the [@alt-javascript](https://github.com/alt-javascript/boot) monorepo.**

## Install

```bash
npm install @alt-javascript/boot-lambda
```

## Usage

```javascript
// handler.js (your Lambda entry point)
import { Boot } from '@alt-javascript/boot';
import { Context, Singleton } from '@alt-javascript/cdi';
import { lambdaStarter } from '@alt-javascript/boot-lambda';
import { TodoService } from './services.js';
import { TodoController } from './controllers.js';

const context = new Context([
  ...lambdaStarter(),
  new Singleton(TodoService),
  new Singleton(TodoController),
]);

// Boot once — CDI is wired on cold start; run: false skips any HTTP server lifecycle
const appCtxPromise = Boot.boot({ contexts: [context], run: false });

export async function handler(event, lambdaContext) {
  const appCtx = await appCtxPromise;
  return appCtx.get('lambdaAdapter').handle(event, lambdaContext);
}
```

## Controller Convention

Controllers use the same `__routes` metadata as all other adapters. Path parameters use API Gateway `{param}` syntax (Express-style `:param` is auto-converted):

```javascript
class TodoController {
  static __routes = [
    { method: 'GET',    path: '/todos',      handler: 'list'   },
    { method: 'POST',   path: '/todos',      handler: 'create' },
    { method: 'GET',    path: '/todos/{id}', handler: 'get'    },
    { method: 'DELETE', path: '/todos/{id}', handler: 'remove' },
  ];

  constructor() { this.todoService = null; } // autowired

  async list(request)   { return this.todoService.findAll(); }
  async create(request) { return this.todoService.create(request.body); }
  async get(request)    { return this.todoService.findById(request.params.id); }
  async remove(request) { return this.todoService.delete(request.params.id); }
}
```

Handlers return a plain object (200 JSON), `{ statusCode, body }` (explicit status), or `null` / `undefined` (204 No Content).

## Middleware Pipeline

`lambdaStarter()` registers three built-in middleware components:

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

const context = new Context([
  ...lambdaStarter(),
  new Singleton(AuthMiddleware), // auto-detected — no extra wiring
  new Singleton(TodoController),
]);
```

## Configuration

Config comes from `process.env` via `EnvPropertySource`. Use AWS SSM Parameter Store or Secrets Manager to inject environment variables at deploy time.

| Key | Default | Description |
|---|---|---|
| `middleware.requestLogger.enabled` | `true` | Enable request logging |
| `middleware.errorHandler.enabled` | `true` | Enable error handler |
| `middleware.notFound.enabled` | `true` | Enable 404 handler |

## Testing

Test the handler directly with API Gateway v2 event shapes — no AWS account needed:

```javascript
import { handler } from '../handler.js';

const event = {
  routeKey: 'GET /todos',
  pathParameters: {},
  queryStringParameters: {},
  headers: { authorization: 'Bearer mytoken' },
  body: null,
  isBase64Encoded: false,
};

const res = await handler(event, {});
assert.equal(res.statusCode, 200);
```

## Spring Attribution

The cold-start / warm-reuse pattern maps to a Spring `ApplicationContext` held in a static field inside a serverless launcher — a common pattern for running Spring Boot in AWS Lambda.

## License

MIT
