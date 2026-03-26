---
estimated_steps: 10
estimated_files: 2
skills_used: []
---

# T01: Thread pipeline into Express adapter

Refactor ControllerRegistrar.register() in boot-express.

Approach: the pipeline wraps each route handler call in ControllerRegistrar.
- Accept a `middlewares` array parameter (from MiddlewarePipeline.collect)
- Wrap the bound handler: `const pipelined = MiddlewarePipeline.compose(middlewares, boundHandler)`
- For Express, the request object already has params/query/body/headers; build a normalised request from req before calling pipelined
- The pipeline result needs to be written to res: if { statusCode, body } write that, else res.json(result)
- Remove the try/catch in the route wrapper — ErrorHandlerMiddleware handles it
- Remove the inline error handler middleware added by ExpressAdapter — NotFoundMiddleware/ErrorHandlerMiddleware replace it

Update ExpressAdapter.init() to collect middleware and pass to ControllerRegistrar.

Express-specific: for global middleware (like auth) to fire before routing, add a pre-route hook via app.use() that runs non-route-specific middleware.

## Inputs

- `packages/boot-express/ControllerRegistrar.js`
- `packages/boot-express/ExpressAdapter.js`
- `packages/boot/MiddlewarePipeline.js`

## Expected Output

- `packages/boot-express/ControllerRegistrar.js (updated)`
- `packages/boot-express/ExpressAdapter.js (updated)`

## Verification

npm test -w packages/boot-express 2>&1 | grep -E 'passing|failing'
