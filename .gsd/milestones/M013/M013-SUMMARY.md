---
id: M013
title: "Cross-Cutting Middleware Pipeline"
status: complete
completed_at: 2026-03-26T12:09:04.442Z
key_decisions:
  - CDI middleware opt-in via static __middleware = { order: N } — symmetric with __routes (D028)
  - compose() is pure functional (array order); collect() sorts by order — separation of CDI from execution
  - _dispatch returns null (no route) vs { statusCode: 204 } (handler returned nothing) — consistent across all 7 adapters
  - Normalised request shape { method, path, params, query, headers, body, ctx } consistent across all adapters
  - Cloudflare 204/304 require null body in undici Response constructor
key_files:
  - packages/boot/MiddlewarePipeline.js
  - packages/boot/middleware/RequestLoggerMiddleware.js
  - packages/boot/middleware/ErrorHandlerMiddleware.js
  - packages/boot/middleware/NotFoundMiddleware.js
  - packages/boot-express/ControllerRegistrar.js
  - packages/boot-fastify/FastifyControllerRegistrar.js
  - packages/boot-koa/KoaAdapter.js
  - packages/boot-hono/HonoControllerRegistrar.js
  - packages/boot-lambda/LambdaAdapter.js
  - packages/boot-azure-function/AzureFunctionAdapter.js
  - packages/boot-cloudflare-worker/CloudflareWorkerAdapter.js
  - packages/example-2-1-servers-express/src/middleware/AuthMiddleware.js
  - packages/example-3-1-serverless-lambda/src/middleware/AuthMiddleware.js
lessons_learned:
  - The _dispatch null-vs-204 distinction is a subtle but important contract — document it at the slice level for future adapters
  - undici's Response constructor rejects 204/304 with a body — always use null body for no-content responses in CF Workers
  - Adapter _toResponse must stay correct when middleware is absent (tests construct adapters directly without CDI) — don't rely solely on middleware for correctness
---

# M013: Cross-Cutting Middleware Pipeline

**Cross-cutting middleware pipeline delivered across all 7 adapters — auth, logging, error handling, 404 via CDI components**

## What Happened

M013 delivered a framework-agnostic CDI middleware pipeline across all 7 server and serverless adapters. The core is MiddlewarePipeline.compose/collect in packages/boot. Three built-in middleware handle logging, error normalisation, and 404. All existing tests pass unmodified. Two examples demonstrate custom AuthMiddleware as a CDI component that works identically across Express (server) and Lambda (serverless) without any adapter-specific code.

## Success Criteria Results

All 6 success criteria met:\n1. ✅ MiddlewarePipeline.compose() unit tested (13 tests)\n2. ✅ static __middleware = { order: N } convention established\n3. ✅ Three built-in middleware wired by all 7 *Starter() functions\n4. ✅ All 7 adapters pipeline-aware, no duplicated error/404 logic\n5. ✅ Existing tests pass unmodified (zero failures)\n6. ✅ Auth + logging + error handling demonstrated in examples

## Definition of Done Results

- ✅ All 5 slices complete with task summaries written\n- ✅ npm test passes across full workspace (Node 20+) — zero failures\n- ✅ No existing test modified to accommodate the new pipeline (entirely additive)\n- ✅ MiddlewarePipeline exported from packages/boot/index.js\n- ✅ DECISIONS.md updated with D028\n- ✅ Both examples runnable with AuthMiddleware demonstration

## Requirement Outcomes

No pre-existing requirements were directly tracked for this milestone. The milestone addresses the cross-cutting concern gap identified across all adapters and advances the framework toward production-readiness.

## Deviations

_dispatch normalises handler null/undefined to { statusCode: 204 } to allow NotFoundMiddleware to distinguish 'route matched, no body' from 'no route matched'. compose() executes in array order (not sorting); collect() owns sorting — cleaner separation. Cloudflare 204/304 responses use null body (undici requirement).

## Follow-ups

Consider adding a rate-limiting built-in middleware. Consider a CORS middleware built-in. Consider documenting the middleware pattern in the package READMEs.
