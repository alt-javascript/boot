# @alt-javascript/boot-fastify

[![Language](https://img.shields.io/badge/language-JavaScript-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![npm version](https://img.shields.io/npm/v/%40alt-javascript%2Fboot-fastify)](https://www.npmjs.com/package/@alt-javascript/boot-fastify)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml/badge.svg)](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml)

Fastify adapter for the `@alt-javascript` framework. Bridges CDI-managed controllers to Fastify routes with a CDI middleware pipeline for cross-cutting concerns.

**Part of the [@alt-javascript](https://github.com/alt-javascript/boot) monorepo.**

## Install

```bash
npm install @alt-javascript/boot-fastify fastify
```

## Usage

```javascript
import { Boot } from '@alt-javascript/boot';
import { Context, Singleton } from '@alt-javascript/cdi';
import { fastifyStarter } from '@alt-javascript/boot-fastify';

class TodoController {
  static __routes = [
    { method: 'GET',  path: '/todos',     handler: 'list'   },
    { method: 'POST', path: '/todos',     handler: 'create' },
    { method: 'GET',  path: '/todos/:id', handler: 'get'    },
  ];

  constructor() { this.todoService = null; } // autowired

  async list(request, reply)   { return this.todoService.findAll(); }
  async create(request, reply) { return this.todoService.create(request.body); }
  async get(request, reply)    { return this.todoService.findById(request.params.id); }
}

const context = new Context([
  ...fastifyStarter(),
  new Singleton(TodoService),
  new Singleton(TodoController),
]);

await Boot.boot({ contexts: [context] });
```

The CDI context is available as `fastify.ctx` (instance decorator) and `request.ctx` (request decorator).

## Controller Patterns

### Declarative (`__routes`)

Handlers receive native Fastify `(request, reply)` arguments.

### Imperative (`routes(fastify, ctx)`)

```javascript
class ImperativeController {
  routes(fastify, ctx) {
    fastify.get('/custom', async (request, reply) => {
      return { from: ctx.get('myService').doSomething() };
    });
  }
}
```

## Middleware Pipeline

`fastifyStarter()` registers three built-in middleware components automatically:

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

Use Fastify's built-in `inject()` for testing without a network:

```javascript
const fastify = appCtx.get('fastifyAdapter').fastify;
const response = await fastify.inject({ method: 'GET', url: '/todos' });
assert.equal(response.statusCode, 200);
```

## License

MIT
