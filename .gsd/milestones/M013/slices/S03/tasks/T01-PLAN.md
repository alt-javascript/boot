---
estimated_steps: 7
estimated_files: 1
skills_used: []
---

# T01: Thread pipeline into LambdaAdapter

Refactor LambdaAdapter.handle() to thread the pipeline.

1. In constructor (or init), call `MiddlewarePipeline.collect(applicationContext)` to get sorted middleware instances
2. Build a `_dispatch(request)` method that does the current route-matching + handler call (returning null when no route matches)
3. `handle(event, lambdaContext)` builds the normalised request object, then calls `MiddlewarePipeline.compose(this._middlewares, this._dispatch.bind(this))(request)`
4. Remove the duplicated try/catch and inline 404 from handle() — those are now ErrorHandlerMiddleware and NotFoundMiddleware
5. _normalizeResponse() remains; the pipeline result goes through it

Import MiddlewarePipeline from @alt-javascript/boot.

## Inputs

- `packages/boot-lambda/LambdaAdapter.js`
- `packages/boot/MiddlewarePipeline.js`

## Expected Output

- `packages/boot-lambda/LambdaAdapter.js (updated)`

## Verification

npm test -w packages/boot-lambda 2>&1 | grep -E 'passing|failing'
