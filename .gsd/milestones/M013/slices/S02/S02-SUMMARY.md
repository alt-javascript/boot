---
id: S02
parent: M013
milestone: M013
provides:
  - RequestLoggerMiddleware, ErrorHandlerMiddleware, NotFoundMiddleware classes
  - All 7 starters auto-register the three middleware — S03/S04 just needs to thread the pipeline through dispatch
requires:
  - slice: S01
    provides: MiddlewarePipeline.compose() and collect()
affects:
  - S03
  - S04
key_files:
  - packages/boot/middleware/RequestLoggerMiddleware.js
  - packages/boot/middleware/ErrorHandlerMiddleware.js
  - packages/boot/middleware/NotFoundMiddleware.js
  - packages/boot/test/middleware.spec.js
key_decisions:
  - RequestLoggerMiddleware re-throws after logging (order 10 outermost) so ErrorHandlerMiddleware (order 20) catches and normalises; log entry still has the error detail
  - All middleware components use _isEnabled() so any can be turned off without replacing the CDI component
patterns_established:
  - Built-in middleware can be replaced by registering a CDI component with the same name before the starter — condition: !components.name pattern
  - Config flags middleware.X.enabled allow runtime disable without component replacement
observability_surfaces:
  - RequestLoggerMiddleware: logs [METHOD] path → status (Xms) on every request via CDI logger at verbose level; logs errors at error level
drill_down_paths:
  - packages/boot/test/middleware.spec.js
duration: ""
verification_result: passed
completed_at: 2026-03-26T11:54:58.208Z
blocker_discovered: false
---

# S02: Built-in Middleware \u2014 Logger, ErrorHandler, NotFound

**Three built-in CDI middleware components wired into all 7 adapter starters**

## What Happened

Implemented the three built-in middleware CDI components, exported them from packages/boot, and wired all 7 adapter starters to include them. 39 tests pass across the boot package.

## Verification

npm test -w packages/boot: 39 passing, 0 failing. Starter wiring verified via node --input-type=module smoke test.

## Requirements Advanced

None.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

None.

## Known Limitations

None.

## Follow-ups

None.

## Files Created/Modified

- `packages/boot/middleware/RequestLoggerMiddleware.js` — New: RequestLoggerMiddleware CDI component
- `packages/boot/middleware/ErrorHandlerMiddleware.js` — New: ErrorHandlerMiddleware CDI component
- `packages/boot/middleware/NotFoundMiddleware.js` — New: NotFoundMiddleware CDI component
- `packages/boot/middleware/index.js` — New: barrel export for built-in middleware
- `packages/boot/index.js` — Added middleware exports
- `packages/boot-express/index.js` — Middleware added to starter
- `packages/boot-fastify/index.js` — Middleware added to starter
- `packages/boot-hono/index.js` — Middleware added to starter
- `packages/boot-koa/index.js` — Middleware added to starter
- `packages/boot-lambda/index.js` — Middleware added to starter
- `packages/boot-azure-function/index.js` — Middleware added to starter
- `packages/boot-cloudflare-worker/index.js` — Middleware added to starter
