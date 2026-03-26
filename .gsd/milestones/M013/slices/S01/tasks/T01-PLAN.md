---
estimated_steps: 12
estimated_files: 1
skills_used: []
---

# T01: Implement MiddlewarePipeline

Create packages/boot/MiddlewarePipeline.js.

Design:
- `MiddlewarePipeline.compose(middlewareInstances, finalHandler)` returns `(request) => Promise<response>`
- Sorts instances by ascending `instance.constructor.__middleware.order` (default order: Infinity so unordered middleware goes last)
- Composes the chain: each middleware receives `(request, next)` where `next` is the remainder of the chain
- `next` can be called with a modified request; returning without calling `next` short-circuits
- `finalHandler` is the innermost fn: `(request) => Promise<response>`
- `MiddlewarePipeline.collect(applicationContext)` scans CDI components for those whose class has `static __middleware`, sorts by order, returns instances

Edge cases:
- Empty middleware list → finalHandler called directly
- Middleware that throws → exception propagates (ErrorHandlerMiddleware catches it at a higher level)
- Middleware that returns undefined after calling next → treated as pass-through (returns the inner result)

## Inputs

- `packages/boot/index.js`
- `packages/cdi/ApplicationContext.js`

## Expected Output

- `packages/boot/MiddlewarePipeline.js`

## Verification

cd packages/boot && npm test 2>&1 | grep -E 'passing|failing'
