# S03: Serverless Adapters — Lambda, CF Workers, Azure Fn

**Goal:** Thread MiddlewarePipeline into the three serverless adapters. Route dispatch becomes the innermost handler. Duplicated try/catch and 404 inline code is removed.
**Demo:** After this: Lambda test: POST /protected without auth header → 401 from AuthMiddleware before handler fires

## Tasks
- [x] **T01: LambdaAdapter threads the CDI middleware pipeline — 32 tests passing** — Refactor LambdaAdapter.handle() to thread the pipeline.

1. In constructor (or init), call `MiddlewarePipeline.collect(applicationContext)` to get sorted middleware instances
2. Build a `_dispatch(request)` method that does the current route-matching + handler call (returning null when no route matches)
3. `handle(event, lambdaContext)` builds the normalised request object, then calls `MiddlewarePipeline.compose(this._middlewares, this._dispatch.bind(this))(request)`
4. Remove the duplicated try/catch and inline 404 from handle() — those are now ErrorHandlerMiddleware and NotFoundMiddleware
5. _normalizeResponse() remains; the pipeline result goes through it

Import MiddlewarePipeline from @alt-javascript/boot.
  - Estimate: 45m
  - Files: packages/boot-lambda/LambdaAdapter.js
  - Verify: npm test -w packages/boot-lambda 2>&1 | grep -E 'passing|failing'
- [x] **T02: AzureFunctionAdapter threads the CDI middleware pipeline — 8 tests passing** — Refactor AzureFunctionAdapter.handle() to thread the pipeline.

Same pattern as Lambda:
1. Collect middleware in constructor
2. _dispatch(request) does route match + handler call, returns null on miss
3. handle() builds request, runs pipeline, normalises response via _toResponse()
4. Remove inline try/catch and 404
  - Estimate: 30m
  - Files: packages/boot-azure-function/AzureFunctionAdapter.js
  - Verify: npm test -w packages/boot-azure-function 2>&1 | grep -E 'passing|failing'
- [x] **T03: CloudflareWorkerAdapter threads the CDI middleware pipeline — 8 tests passing** — Refactor CloudflareWorkerAdapter.fetch() to thread the pipeline.

Same pattern:
1. Collect middleware in constructor
2. _dispatch(request) does route match + handler call, returns null on miss
3. fetch() builds request, runs pipeline, normalises result via _toResponse()
4. Remove inline try/catch and 404

Note: _toResponse() returns a Web Standards Response — the pipeline result (plain object) needs normalising before returning from fetch().
  - Estimate: 30m
  - Files: packages/boot-cloudflare-worker/CloudflareWorkerAdapter.js
  - Verify: npm test -w packages/boot-cloudflare-worker 2>&1 | grep -E 'passing|failing'
