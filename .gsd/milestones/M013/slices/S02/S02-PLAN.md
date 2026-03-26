# S02: Built-in Middleware — Logger, ErrorHandler, NotFound

**Goal:** Implement the three built-in CDI middleware components in packages/boot. Wire them conditionally into each *Starter() via conditionalOnMissingBean. Each is individually disableable via config.
**Demo:** After this: expressStarter() returns component list including requestLoggerMiddleware, errorHandlerMiddleware, notFoundMiddleware

## Tasks
- [x] **T01: Implemented RequestLoggerMiddleware, ErrorHandlerMiddleware, NotFoundMiddleware** — Create packages/boot/middleware/RequestLoggerMiddleware.js

- static __middleware = { order: 10 }
- Reads CDI logger via setApplicationContext / this._applicationContext
- On handle(request, next): records start time, calls next, logs: `[METHOD] path → statusCode (Xms)` at 'verbose' level
- If next throws, logs the error at 'error' level then re-throws (ErrorHandlerMiddleware catches it)
- Config flag: `middleware.requestLogger.enabled` (default true); skip install if false

Create packages/boot/middleware/ErrorHandlerMiddleware.js

- static __middleware = { order: 20 }
- On handle(request, next): wraps next in try/catch; on throw returns { statusCode: err.statusCode || 500, body: { error: err.message } }
- Logs error via CDI logger at 'error' level before returning
- Config flag: `middleware.errorHandler.enabled` (default true)

Create packages/boot/middleware/NotFoundMiddleware.js

- static __middleware = { order: 30 }
- On handle(request, next): calls next; if result is null/undefined or statusCode === 404, returns { statusCode: 404, body: { error: 'Not found' } }
- Actually: acts as innermost pre-handler — if no route matched the adapter sets a sentinel; NotFoundMiddleware produces the 404 response
- Simpler model: NotFoundMiddleware is the last in the chain (highest order), calls next; the adapter's route dispatch is the finalHandler. If no route matches, dispatch returns null and NotFoundMiddleware converts to 404.

Create packages/boot/middleware/index.js that exports all three.
  - Estimate: 1h
  - Files: packages/boot/middleware/RequestLoggerMiddleware.js, packages/boot/middleware/ErrorHandlerMiddleware.js, packages/boot/middleware/NotFoundMiddleware.js, packages/boot/middleware/index.js
  - Verify: node --input-type=module -e "import { RequestLoggerMiddleware, ErrorHandlerMiddleware, NotFoundMiddleware } from './packages/boot/middleware/index.js'; console.log('ok');" 2>&1
- [x] **T02: Wired built-in middleware into all 7 *Starter() functions** — Add the three middleware components to packages/boot/index.js exports.

Also export them individually:
  export { RequestLoggerMiddleware, ErrorHandlerMiddleware, NotFoundMiddleware } from './middleware/index.js';

Update each *Starter() function in boot-express, boot-fastify, boot-hono, boot-koa, boot-lambda, boot-azure-function, boot-cloudflare-worker to include the three middleware components using conditionalOnMissingBean so users can replace any of them.

The starter additions look like:
  { name: 'requestLoggerMiddleware', Reference: RequestLoggerMiddleware, scope: 'singleton', condition: (config, components) => !components.requestLoggerMiddleware },
  { name: 'errorHandlerMiddleware', Reference: ErrorHandlerMiddleware, scope: 'singleton', condition: (config, components) => !components.errorHandlerMiddleware },
  { name: 'notFoundMiddleware', Reference: NotFoundMiddleware, scope: 'singleton', condition: (config, components) => !components.notFoundMiddleware },

For Lambda, CF Workers, and Azure Fn the starters don't currently exist as CDI-wired components (adapters wire themselves differently) — the middleware components still need to be included in the starter arrays so CDI registers them.
  - Estimate: 45m
  - Files: packages/boot/index.js, packages/boot-express/index.js, packages/boot-fastify/index.js, packages/boot-hono/index.js, packages/boot-koa/index.js, packages/boot-lambda/index.js, packages/boot-azure-function/index.js, packages/boot-cloudflare-worker/index.js
  - Verify: node --input-type=module -e "import { expressStarter } from './packages/boot-express/index.js'; const s = expressStarter(); console.log(s.map(c => c.name).join(', '));"
- [x] **T03: 17 unit tests for built-in middleware — all passing** — Create packages/boot/test/middleware.spec.js covering all three middleware:

RequestLoggerMiddleware:
- calls next and returns its result
- logs method/path/status/duration (mock logger captured via setApplicationContext)
- re-throws if next throws (after logging)

ErrorHandlerMiddleware:
- passes through when next succeeds
- catches thrown error, returns { statusCode: err.statusCode || 500, body: { error: err.message } }
- uses err.statusCode when present (e.g. 404 from a controller throwing a structured error)

NotFoundMiddleware:
- passes through non-null results from next
- converts null result to 404
- converts undefined result to 404
  - Estimate: 45m
  - Files: packages/boot/test/middleware.spec.js
  - Verify: cd packages/boot && npm test 2>&1 | grep -E 'passing|failing|middleware'
