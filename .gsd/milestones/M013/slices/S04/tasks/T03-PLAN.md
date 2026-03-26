---
estimated_steps: 9
estimated_files: 1
skills_used: []
---

# T03: Thread pipeline into Koa adapter

Refactor KoaAdapter._routingMiddleware() to thread the pipeline.

Koa approach:
- KoaAdapter._routingMiddleware() already owns the dispatch loop
- Collect CDI middleware in KoaAdapter.init()
- Build normalised request from koaCtx
- Run MiddlewarePipeline.compose(middlewares, dispatch)(request)
- Write pipeline result to koaCtx.status/koaCtx.body
- Remove duplicated try/catch and 404 from _routingMiddleware

Koa's own app.use() stack (body parser, cdiContext injection) remains unchanged.

## Inputs

- `packages/boot-koa/KoaAdapter.js`

## Expected Output

- `packages/boot-koa/KoaAdapter.js (updated)`

## Verification

npm test -w packages/boot-koa 2>&1 | grep -E 'passing|failing'
