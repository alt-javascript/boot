# S01: Core Pipeline — MiddlewarePipeline compose utility

**Goal:** Implement the pure-functional MiddlewarePipeline composer in packages/boot, export it from the package index, and prove ordering + short-circuit semantics with unit tests.
**Demo:** After this: MiddlewarePipeline.compose([auth, logger, notFound])(request) returns 401 when auth rejects, calls logger and notFound only when auth passes

## Tasks
- [x] **T01: Implemented MiddlewarePipeline.compose() and collect() in packages/boot** — Create packages/boot/MiddlewarePipeline.js.

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
  - Estimate: 1h
  - Files: packages/boot/MiddlewarePipeline.js
  - Verify: cd packages/boot && npm test 2>&1 | grep -E 'passing|failing'
- [x] **T02: Exported MiddlewarePipeline from packages/boot/index.js** — Add `export { default as MiddlewarePipeline } from './MiddlewarePipeline.js';` to packages/boot/index.js
  - Estimate: 10m
  - Files: packages/boot/index.js
  - Verify: node --input-type=module -e "import { MiddlewarePipeline } from './packages/boot/index.js'; console.log(typeof MiddlewarePipeline.compose);"
- [x] **T03: 13 unit tests for MiddlewarePipeline — all passing** — Create packages/boot/test/MiddlewarePipeline.spec.js covering:
1. Empty middleware — finalHandler called with original request
2. Single middleware — runs, calls next, returns finalHandler result
3. Multiple middlewares — executed in ascending __middleware.order regardless of array order
4. Short-circuit — middleware returns early without calling next; finalHandler never called
5. Request mutation — middleware adds property to request; downstream middleware and handler see it
6. collect() — scans mock CDI components, returns only those with __middleware, sorted by order
7. Order tie-breaking — two middlewares with same order maintain stable relative position (or document the behaviour)
8. Middleware that throws — exception propagates out of compose()
  - Estimate: 1h
  - Files: packages/boot/test/MiddlewarePipeline.spec.js
  - Verify: cd packages/boot && npm test 2>&1 | grep -E 'MiddlewarePipeline|passing|failing'
