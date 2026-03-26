---
estimated_steps: 9
estimated_files: 1
skills_used: []
---

# T03: Unit tests for MiddlewarePipeline

Create packages/boot/test/MiddlewarePipeline.spec.js covering:
1. Empty middleware — finalHandler called with original request
2. Single middleware — runs, calls next, returns finalHandler result
3. Multiple middlewares — executed in ascending __middleware.order regardless of array order
4. Short-circuit — middleware returns early without calling next; finalHandler never called
5. Request mutation — middleware adds property to request; downstream middleware and handler see it
6. collect() — scans mock CDI components, returns only those with __middleware, sorted by order
7. Order tie-breaking — two middlewares with same order maintain stable relative position (or document the behaviour)
8. Middleware that throws — exception propagates out of compose()

## Inputs

- `packages/boot/MiddlewarePipeline.js`
- `packages/boot/test/fixtures/index.js`

## Expected Output

- `packages/boot/test/MiddlewarePipeline.spec.js`

## Verification

cd packages/boot && npm test 2>&1 | grep -E 'MiddlewarePipeline|passing|failing'
