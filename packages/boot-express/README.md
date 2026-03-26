# @alt-javascript/boot-express

[![Language](https://img.shields.io/badge/language-JavaScript-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![npm version](https://img.shields.io/npm/v/%40alt-javascript%2Fboot-express)](https://www.npmjs.com/package/@alt-javascript/boot-express)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml/badge.svg)](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml)

Express adapter for the `@alt-javascript` framework. Bridges CDI-managed controllers to Express routes with a CDI middleware pipeline for cross-cutting concerns.

**Inspired by Spring MVC `@RestController` / `@RequestMapping` and Spring Security's filter chain.**

**Part of the [@alt-javascript](https://github.com/alt-javascript/boot) monorepo.**

## Install

```bash
npm install @alt-javascript/boot-express express
```

## Usage

Define a controller with `__routes` metadata and boot with `expressStarter()`:

```javascript
import { Boot } from '@alt-javascript/boot';
import { Context, Singleton } from '@alt-javascript/cdi';
import { expressStarter } from '@alt-javascript/boot-express';

class TodoController {
  static __routes = [
    { method: 'GET',    path: '/todos',     handler: 'list'   },
    { method: 'POST',   path: '/todos',     handler: 'create' },
    { method: 'GET',    path: '/todos/:id', handler: 'get'    },
    { method: 'DELETE', path: '/todos/:id', handler: 'remove' },
  ];

  constructor() { this.todoService = null; } // autowired

  async list(req)   { return this.todoService.findAll(); }
  async create(req) { return this.todoService.create(req.body); }
  async get(req)    { return this.todoService.findById(req.params.id); }
  async remove(req) { return this.todoService.delete(req.params.id); }
}

const context = new Context([
  ...expressStarter(),
  new Singleton(TodoService),
  new Singleton(TodoController),
]);

await Boot.boot({ contexts: [context] });
// Express is listening on server.port (default 3000)
```

The adapter discovers all CDI beans with `__routes`, binds handlers to Express routes, and makes the CDI context available as `req.app.locals.ctx`.

## Controller Patterns

### Declarative (`__routes`)

Handlers receive the native Express `(req, res, next)` arguments:

```javascript
async greet(req, res) {
  const message = this.greetingService.greet(req.params.name);
  res.json({ message });
}
```

### Imperative (`routes(app, ctx)`)

```javascript
class ImperativeController {
  routes(app, ctx) {
    app.get('/custom', (req, res) => {
      res.json({ from: ctx.get('myService').doSomething() });
    });
  }
}
```

## Middleware Pipeline

`expressStarter()` registers three built-in middleware components via the CDI middleware pipeline — the equivalent of Spring Security's filter chain:

| Component | Order | Behaviour |
|---|---|---|
| `RequestLoggerMiddleware` | 10 | Logs `[METHOD] /path → status (Xms)` |
| `ErrorHandlerMiddleware` | 20 | Converts thrown errors to JSON error responses |
| `NotFoundMiddleware` | 30 | Returns 404 for unmatched routes |

Add custom middleware by declaring `static __middleware = { order: N }` on any CDI component:

```javascript
class AuthMiddleware {
  static __middleware = { order: 5 }; // runs outermost — before RequestLoggerMiddleware

  constructor() { this.logger = null; } // autowired

  async handle(request, next) {
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (!token) return { statusCode: 401, body: { error: 'Unauthorized' } };
    return next({ ...request, user: { token } });
  }
}

const context = new Context([
  ...expressStarter(),
  new Singleton(AuthMiddleware), // auto-detected — no extra wiring
  new Singleton(TodoController),
]);
```

Disable a built-in middleware via config:

```json
{ "middleware": { "requestLogger": { "enabled": false } } }
```

Replace a built-in by registering a component with the same name before the starter:

```javascript
new Context([
  { name: 'errorHandlerMiddleware', Reference: MyErrorHandler, scope: 'singleton' },
  ...expressStarter(),
])
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

Use `supertest` and `expressAdapter.app` to test without binding a port:

```javascript
import supertest from 'supertest';
import { expressStarter, ExpressAdapter } from '@alt-javascript/boot-express';

const appCtx = /* boot context with run: false */;
const app = appCtx.get('expressAdapter').app;

const res = await supertest(app).get('/todos');
assert.equal(res.status, 200);
```

## Spring Attribution

The `__routes` convention maps to Spring MVC's `@RequestMapping` / `@GetMapping`. The `static __middleware = { order: N }` convention maps to Spring Security's `Filter` + `FilterRegistrationBean(setOrder(n))`. `expressStarter()` maps to a Spring Boot auto-configuration class.

## License

MIT
