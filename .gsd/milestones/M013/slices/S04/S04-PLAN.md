# S04: Server Adapters — Express, Fastify, Koa, Hono

**Goal:** Thread MiddlewarePipeline into the four server adapters. Auth/observability middleware registers as native pre-route hooks so it fires before routing. Error handler and 404 replace duplicated inline logic.
**Demo:** After this: Express integration test: GET /secret without Authorization → 401; GET /unknown → 404 JSON; handler throw → 500 JSON

## Tasks
- [x] **T01: Express adapter threads the CDI middleware pipeline — 24 tests passing** — Refactor ControllerRegistrar.register() in boot-express.

Approach: the pipeline wraps each route handler call in ControllerRegistrar.
- Accept a `middlewares` array parameter (from MiddlewarePipeline.collect)
- Wrap the bound handler: `const pipelined = MiddlewarePipeline.compose(middlewares, boundHandler)`
- For Express, the request object already has params/query/body/headers; build a normalised request from req before calling pipelined
- The pipeline result needs to be written to res: if { statusCode, body } write that, else res.json(result)
- Remove the try/catch in the route wrapper — ErrorHandlerMiddleware handles it
- Remove the inline error handler middleware added by ExpressAdapter — NotFoundMiddleware/ErrorHandlerMiddleware replace it

Update ExpressAdapter.init() to collect middleware and pass to ControllerRegistrar.

Express-specific: for global middleware (like auth) to fire before routing, add a pre-route hook via app.use() that runs non-route-specific middleware.
  - Estimate: 1h
  - Files: packages/boot-express/ControllerRegistrar.js, packages/boot-express/ExpressAdapter.js
  - Verify: npm test -w packages/boot-express 2>&1 | grep -E 'passing|failing'
- [x] **T02: Fastify adapter threads the CDI middleware pipeline — 24 tests passing** — Refactor FastifyControllerRegistrar and FastifyAdapter.

Fastify approach:
- Collect middleware in FastifyAdapter.init()
- Pass to FastifyControllerRegistrar.register()
- In the route handler, build a normalised request (same shape as other adapters) and run through pipeline
- addHook('preHandler') not needed — the pipeline wraps the individual handler, which is sufficient since ErrorHandlerMiddleware catches throws and NotFoundMiddleware isn't triggered (Fastify handles 404 natively)

For auth to short-circuit before routing: add a global preHandler hook in FastifyAdapter.init() that runs auth-only middleware.
  - Estimate: 1h
  - Files: packages/boot-fastify/FastifyControllerRegistrar.js, packages/boot-fastify/FastifyAdapter.js
  - Verify: npm test -w packages/boot-fastify 2>&1 | grep -E 'passing|failing'
- [x] **T03: Koa adapter threads the CDI middleware pipeline — 9 tests passing** — Refactor KoaAdapter._routingMiddleware() to thread the pipeline.

Koa approach:
- KoaAdapter._routingMiddleware() already owns the dispatch loop
- Collect CDI middleware in KoaAdapter.init()
- Build normalised request from koaCtx
- Run MiddlewarePipeline.compose(middlewares, dispatch)(request)
- Write pipeline result to koaCtx.status/koaCtx.body
- Remove duplicated try/catch and 404 from _routingMiddleware

Koa's own app.use() stack (body parser, cdiContext injection) remains unchanged.
  - Estimate: 45m
  - Files: packages/boot-koa/KoaAdapter.js
  - Verify: npm test -w packages/boot-koa 2>&1 | grep -E 'passing|failing'
- [x] **T04: Hono adapter threads the CDI middleware pipeline — 8 tests passing** — Refactor HonoControllerRegistrar and HonoAdapter to thread the pipeline.

Hono approach:
- Collect CDI middleware in HonoAdapter.init()
- Pass to HonoControllerRegistrar.register()
- Each route handler builds a normalised request, runs pipeline, converts result to Hono Response via c.json()/c.body()
- Remove duplicated try/catch from HonoControllerRegistrar
  - Estimate: 45m
  - Files: packages/boot-hono/HonoControllerRegistrar.js, packages/boot-hono/HonoAdapter.js
  - Verify: npm test -w packages/boot-hono 2>&1 | grep -E 'passing|failing'
