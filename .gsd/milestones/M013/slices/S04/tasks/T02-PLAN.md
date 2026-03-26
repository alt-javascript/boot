---
estimated_steps: 7
estimated_files: 2
skills_used: []
---

# T02: Thread pipeline into Fastify adapter

Refactor FastifyControllerRegistrar and FastifyAdapter.

Fastify approach:
- Collect middleware in FastifyAdapter.init()
- Pass to FastifyControllerRegistrar.register()
- In the route handler, build a normalised request (same shape as other adapters) and run through pipeline
- addHook('preHandler') not needed — the pipeline wraps the individual handler, which is sufficient since ErrorHandlerMiddleware catches throws and NotFoundMiddleware isn't triggered (Fastify handles 404 natively)

For auth to short-circuit before routing: add a global preHandler hook in FastifyAdapter.init() that runs auth-only middleware.

## Inputs

- `packages/boot-fastify/FastifyControllerRegistrar.js`
- `packages/boot-fastify/FastifyAdapter.js`

## Expected Output

- `packages/boot-fastify/FastifyControllerRegistrar.js (updated)`
- `packages/boot-fastify/FastifyAdapter.js (updated)`

## Verification

npm test -w packages/boot-fastify 2>&1 | grep -E 'passing|failing'
