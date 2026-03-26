---
id: S04
parent: M013
milestone: M013
provides:
  - All 7 adapters pipeline-aware; middleware registered in CDI context works across every adapter without any adapter-specific code
requires:
  - slice: S01
    provides: MiddlewarePipeline.compose() and collect()
  - slice: S02
    provides: Built-in middleware CDI components
affects:
  - S05
key_files:
  - packages/boot-express/ControllerRegistrar.js
  - packages/boot-fastify/FastifyControllerRegistrar.js
  - packages/boot-koa/KoaAdapter.js
  - packages/boot-hono/HonoControllerRegistrar.js
key_decisions:
  - Normalised request shape (method, path, params, query, headers, body, ctx) is consistent across all 7 adapters now — middleware can rely on it
  - res.headersSent guard in ControllerRegistrar prevents double-write when imperative Express handlers write directly
patterns_established:
  - Normalised request shape { method, path, params, query, headers, body, ctx } is consistent across all 7 adapters — middleware written against this shape works everywhere
observability_surfaces:
  - RequestLoggerMiddleware now logs every server request when wired via *Starter() functions
drill_down_paths:
  - packages/boot-express/test/ExpressAdapter.spec.js
  - packages/boot-fastify/test/FastifyAdapter.spec.js
  - packages/boot-koa/test/KoaAdapter.spec.js
  - packages/boot-hono/test/HonoAdapter.spec.js
duration: ""
verification_result: passed
completed_at: 2026-03-26T12:04:27.195Z
blocker_discovered: false
---

# S04: Server Adapters \u2014 Express, Fastify, Koa, Hono

**All 4 server adapters thread the CDI middleware pipeline — 65 tests passing, 0 failing**

## What Happened

All four server adapters now thread the MiddlewarePipeline. 65 tests across Express (24), Fastify (24), Koa (9), Hono (8) pass. Duplicated error handling and 404 logic removed from all adapters. Full workspace: zero failing tests.

## Verification

npm test --workspaces: zero failing tests. All adapter test suites pass unmodified.

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

- `packages/boot-express/ControllerRegistrar.js` — Threads middleware pipeline; builds normalised request; res.headersSent guard
- `packages/boot-express/ExpressAdapter.js` — Collects middleware before registering controllers
- `packages/boot-fastify/FastifyControllerRegistrar.js` — Threads middleware pipeline; normalised request shape
- `packages/boot-fastify/FastifyAdapter.js` — Collects middleware before registering controllers
- `packages/boot-koa/KoaAdapter.js` — _routingMiddleware threads pipeline; duplicate try/catch and 404 removed
- `packages/boot-hono/HonoControllerRegistrar.js` — Threads middleware pipeline; normalised request shape
- `packages/boot-hono/HonoAdapter.js` — Collects middleware before registering controllers
