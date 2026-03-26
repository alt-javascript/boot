---
estimated_steps: 7
estimated_files: 1
skills_used: []
---

# T03: Thread pipeline into CloudflareWorkerAdapter

Refactor CloudflareWorkerAdapter.fetch() to thread the pipeline.

Same pattern:
1. Collect middleware in constructor
2. _dispatch(request) does route match + handler call, returns null on miss
3. fetch() builds request, runs pipeline, normalises result via _toResponse()
4. Remove inline try/catch and 404

Note: _toResponse() returns a Web Standards Response — the pipeline result (plain object) needs normalising before returning from fetch().

## Inputs

- `packages/boot-cloudflare-worker/CloudflareWorkerAdapter.js`
- `packages/boot/MiddlewarePipeline.js`

## Expected Output

- `packages/boot-cloudflare-worker/CloudflareWorkerAdapter.js (updated)`

## Verification

npm test -w packages/boot-cloudflare-worker 2>&1 | grep -E 'passing|failing'
