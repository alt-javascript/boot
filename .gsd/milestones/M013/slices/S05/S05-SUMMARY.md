---
id: S05
parent: M013
milestone: M013
provides:
  - Working end-to-end examples of the middleware pattern for consumers
requires:
  - slice: S04
    provides: Pipeline-aware adapters
  - slice: S03
    provides: Pipeline-aware serverless adapters
affects:
  []
key_files:
  - packages/example-2-1-servers-express/src/middleware/AuthMiddleware.js
  - packages/example-3-1-serverless-lambda/src/middleware/AuthMiddleware.js
key_decisions:
  - AuthMiddleware.order = 5 (before RequestLoggerMiddleware:10) so the 401 is logged with correct status
  - Same AuthMiddleware source works across both adapters — demonstrates adapter-agnosticism of the pattern
patterns_established:
  - AuthMiddleware registers as static __middleware = { order: 5 }, selectively skips public routes, attaches user to request for downstream middleware and handlers
  - The same middleware source works across all adapters — write once, run everywhere
observability_surfaces:
  - AuthMiddleware logs rejection at verbose level with method/path context
drill_down_paths:
  - packages/example-2-1-servers-express/src/middleware/AuthMiddleware.js
  - packages/example-3-1-serverless-lambda/src/middleware/AuthMiddleware.js
  - packages/example-3-1-serverless-lambda/test/handler.spec.js
duration: ""
verification_result: passed
completed_at: 2026-03-26T12:08:20.866Z
blocker_discovered: false
---

# S05: Examples \u2014 Auth + Logging + Error Handling end-to-end

**Auth middleware demonstrated in Express and Lambda examples — all tests passing, decision recorded**

## What Happened

Both examples show a complete AuthMiddleware CDI component. Lambda example now has 7 tests including explicit 401 (no token) and 200 (valid token) cases. Full workspace: zero failing tests. Decision D028 recorded.

## Verification

Full workspace npm test: 0 failing. Lambda example: 7 passing including 401 and auth-success cases.

## Requirements Advanced

None.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

Example tests updated to send auth headers (tests now prove the auth feature, not a regression).

## Known Limitations

None.

## Follow-ups

None.

## Files Created/Modified

- `packages/example-2-1-servers-express/src/middleware/AuthMiddleware.js` — New: AuthMiddleware CDI component (Express example)
- `packages/example-2-1-servers-express/main.js` — Added AuthMiddleware registration and /secret route
- `packages/example-2-1-servers-express/src/controllers.js` — Added /secret handler
- `packages/example-3-1-serverless-lambda/src/middleware/AuthMiddleware.js` — New: AuthMiddleware CDI component (Lambda example)
- `packages/example-3-1-serverless-lambda/handler.js` — Added AuthMiddleware registration and /secret route
- `packages/example-3-1-serverless-lambda/src/controllers.js` — Added /secret handler
- `packages/example-3-1-serverless-lambda/test/handler.spec.js` — Added auth headers; added 401 and secret tests
- `.gsd/DECISIONS.md` — Added D028 middleware architecture decision
