---
estimated_steps: 6
estimated_files: 2
skills_used: []
---

# T04: Thread pipeline into Hono adapter

Refactor HonoControllerRegistrar and HonoAdapter to thread the pipeline.

Hono approach:
- Collect CDI middleware in HonoAdapter.init()
- Pass to HonoControllerRegistrar.register()
- Each route handler builds a normalised request, runs pipeline, converts result to Hono Response via c.json()/c.body()
- Remove duplicated try/catch from HonoControllerRegistrar

## Inputs

- `packages/boot-hono/HonoControllerRegistrar.js`
- `packages/boot-hono/HonoAdapter.js`

## Expected Output

- `packages/boot-hono/HonoControllerRegistrar.js (updated)`
- `packages/boot-hono/HonoAdapter.js (updated)`

## Verification

npm test -w packages/boot-hono 2>&1 | grep -E 'passing|failing'
