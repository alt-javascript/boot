---
estimated_steps: 6
estimated_files: 1
skills_used: []
---

# T02: Thread pipeline into AzureFunctionAdapter

Refactor AzureFunctionAdapter.handle() to thread the pipeline.

Same pattern as Lambda:
1. Collect middleware in constructor
2. _dispatch(request) does route match + handler call, returns null on miss
3. handle() builds request, runs pipeline, normalises response via _toResponse()
4. Remove inline try/catch and 404

## Inputs

- `packages/boot-azure-function/AzureFunctionAdapter.js`
- `packages/boot/MiddlewarePipeline.js`

## Expected Output

- `packages/boot-azure-function/AzureFunctionAdapter.js (updated)`

## Verification

npm test -w packages/boot-azure-function 2>&1 | grep -E 'passing|failing'
