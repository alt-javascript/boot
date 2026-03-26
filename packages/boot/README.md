# @alt-javascript/boot

[![Language](https://img.shields.io/badge/language-JavaScript-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![npm version](https://img.shields.io/npm/v/%40alt-javascript%2Fboot)](https://www.npmjs.com/package/@alt-javascript/boot)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml/badge.svg)](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml)

Application bootstrap for the `@alt-javascript` framework. Detects the runtime environment (Node.js or browser), resolves configuration, initialises the global boot context, and provides the CDI middleware pipeline used by all HTTP adapters.

**Inspired by [Spring Boot](https://spring.io/projects/spring-boot)'s auto-configuration and application context lifecycle.**

**Part of the [@alt-javascript](https://github.com/alt-javascript/boot) monorepo.**

## Install

```bash
npm install @alt-javascript/boot
```

## Quick Start

```javascript
import { Boot } from '@alt-javascript/boot';
import { EphemeralConfig } from '@alt-javascript/config';

const config = new EphemeralConfig({
  logging: { level: { ROOT: 'info' } },
});

Boot.boot({ config });
// global.boot.contexts.root is now populated with { config, loggerFactory, loggerCategoryCache, fetch }
```

## API

```javascript
import {
  Boot,
  Application,
  MiddlewarePipeline,
  RequestLoggerMiddleware,
  ErrorHandlerMiddleware,
  NotFoundMiddleware,
  boot,
  root,
  test,
  config,
} from '@alt-javascript/boot';
```

### Boot

Inspired by Spring Boot's `SpringApplication.run()` — detects config, wires infrastructure, and optionally starts the CDI container.

| Method | Description |
|---|---|
| `Boot.boot(options?)` | Bootstrap — detects config, populates global boot context. Pass `{ contexts }` to also start a CDI `ApplicationContext`. |
| `Boot.test(options?)` | Test bootstrap — uses `CachingLoggerFactory` to suppress log output. |
| `Boot.root(name, default?)` | Read a value from the global boot context (`boot.contexts.root`). |
| `Boot.detectConfig(args?)` | Auto-detect config from: explicit argument → `global.config` → `window.config`. |

### Application

```javascript
import { Application } from '@alt-javascript/boot';

await Application.run({ config, contexts: [context] });
```

`Application.run()` calls `Boot.boot()`, then dynamically imports `@alt-javascript/cdi/ApplicationContext` to create a full DI container and run its lifecycle.

### MiddlewarePipeline

The CDI middleware pipeline — the equivalent of Spring Security's filter chain or Express middleware, applied uniformly across all seven HTTP and serverless adapters.

```javascript
import { MiddlewarePipeline } from '@alt-javascript/boot';

// Compose an ordered chain around a final handler
const pipeline = MiddlewarePipeline.compose([authMw, logMw], finalHandler);
const response = await pipeline(request);

// Collect all CDI components that declare __middleware from a context
const middlewares = MiddlewarePipeline.collect(applicationContext);
```

#### Writing Middleware

A middleware component is a plain CDI class with `static __middleware = { order: N }` and a `handle(request, next)` method. Lower order = outermost (runs first, wraps everything inside it).

```javascript
class AuthMiddleware {
  static __middleware = { order: 5 };

  constructor() { this.logger = null; } // autowired

  async handle(request, next) {
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return { statusCode: 401, body: { error: 'Unauthorized' } };
    }
    // Attach user to the request for downstream handlers
    return next({ ...request, user: { token } });
  }
}
```

Register it in the CDI context — no other wiring needed:

```javascript
import { expressStarter } from '@alt-javascript/boot-express';
import { Context, Singleton } from '@alt-javascript/cdi';
import { Boot } from '@alt-javascript/boot';

const context = new Context([
  ...expressStarter(),         // includes built-in middleware
  new Singleton(AuthMiddleware), // auto-detected via __middleware
  new Singleton(MyController),
]);

await Boot.boot({ contexts: [context] });
```

#### Normalised Request Shape

All adapters (Express, Fastify, Koa, Hono, Lambda, Cloudflare Workers, Azure Functions) present the same request shape to middleware:

```javascript
{
  method: 'GET',           // HTTP method
  path: '/todos/42',       // URL path
  params: { id: '42' },   // path parameters
  query: { page: '1' },   // query string parameters
  headers: { ... },        // request headers
  body: { ... },           // parsed request body
  ctx: applicationContext, // CDI ApplicationContext
  // adapter-specific: req (Express), fastifyRequest, honoCtx, koaCtx, rawEvent (Lambda), ...
}
```

Middleware written against this shape works identically across all adapters.

#### Built-in Middleware

Every `*Starter()` function registers these three middleware components automatically:

| Class | Order | Behaviour | Config flag to disable |
|---|---|---|---|
| `RequestLoggerMiddleware` | 10 | Logs `[METHOD] /path → status (Xms)` at verbose level | `middleware.requestLogger.enabled: false` |
| `ErrorHandlerMiddleware` | 20 | Converts unhandled exceptions to `{ statusCode, body: { error } }` | `middleware.errorHandler.enabled: false` |
| `NotFoundMiddleware` | 30 | Returns 404 when no route matches | `middleware.notFound.enabled: false` |

Replace any built-in by registering a component with the same name before the starter:

```javascript
const context = new Context([
  { name: 'errorHandlerMiddleware', Reference: MyErrorHandler, scope: 'singleton' },
  ...expressStarter(), // condition: !components.errorHandlerMiddleware — skips built-in
]);
```

## Test Fixtures

Use `Boot.test()` in your mocha `--require` file to suppress logging during tests:

```javascript
// test/fixtures/index.js
import { Boot } from '@alt-javascript/boot';
import config from 'config';

Boot.test({ config });
```

## Browser

Browser variants (`Boot-browser.js`, `Application-browser.js`, `index-browser.js`) use `window` instead of `global` and avoid Node-specific APIs. Import via `index-browser.js` or use an import map.

## Spring Attribution

The `Boot` lifecycle (`detectConfig` → `loggerFactory` → `ApplicationContext.prepare` → `run`) maps to Spring Boot's `SpringApplication.run()` → `Environment` → `ApplicationContext.refresh()` → `ApplicationRunner` sequence. The middleware pipeline maps to Spring Security's `FilterChain` — `handle(request, next)` is equivalent to `doFilter(request, response, chain)`.

## License

MIT
