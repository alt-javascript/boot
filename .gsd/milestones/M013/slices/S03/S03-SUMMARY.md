---
id: S03
parent: M013
milestone: M013
provides:
  - Lambda, Azure Fn, CF Workers all pipeline-aware; S04 server adapters can follow the same pattern
requires:
  - slice: S01
    provides: MiddlewarePipeline.compose() and collect()
  - slice: S02
    provides: Built-in middleware CDI components registered via starters
affects:
  - S04
key_files:
  - packages/boot-lambda/LambdaAdapter.js
  - packages/boot-azure-function/AzureFunctionAdapter.js
  - packages/boot-cloudflare-worker/CloudflareWorkerAdapter.js
key_decisions:
  - _dispatch returns null (no route) vs { statusCode: 204 } (handler returned nothing) — allows NotFoundMiddleware to work correctly
  - Adapter _toResponse must remain 404 for null when middleware is absent — backward compatibility
patterns_established:
  - _dispatch(request): null for no-route, { statusCode: 204 } for handler-returned-nothing — consistent across all adapters
observability_surfaces:
  - RequestLoggerMiddleware now logs every Lambda/Azure/CF Workers invocation when wired via lambdaStarter()/azureFunctionStarter()/cloudflareWorkerStarter()
drill_down_paths:
  - packages/boot-lambda/test/LambdaAdapter.spec.js
  - packages/boot-azure-function/test/AzureFunctionAdapter.spec.js
  - packages/boot-cloudflare-worker/test/CloudflareWorkerAdapter.spec.js
duration: ""
verification_result: passed
completed_at: 2026-03-26T12:00:58.004Z
blocker_discovered: false
---

# S03: Serverless Adapters \u2014 Lambda, CF Workers, Azure Fn

**All three serverless adapters thread the CDI middleware pipeline — 48 tests passing**

## What Happened

All three serverless adapters thread the MiddlewarePipeline. 48 tests passing across Lambda (32), Azure (8), and CF Workers (8). Inline try/catch and 404 removed from all three adapters.

## Verification

npm test -w packages/boot-lambda -w packages/boot-azure-function -w packages/boot-cloudflare-worker: 48 passing, 0 failing.

## Requirements Advanced

None.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

_dispatch normalises handler null/undefined to { statusCode: 204 } to allow NotFoundMiddleware to distinguish 'route matched but no body' from 'no route matched'. _toResponse null fallback is 404 (not 204) to stay correct when middleware is absent.

## Known Limitations

None.

## Follow-ups

None.

## Files Created/Modified

- `packages/boot-lambda/LambdaAdapter.js` — Refactored to thread MiddlewarePipeline; removed inline try/catch and 404
- `packages/boot-azure-function/AzureFunctionAdapter.js` — Refactored to thread MiddlewarePipeline; fixed _toResponse null→404
- `packages/boot-cloudflare-worker/CloudflareWorkerAdapter.js` — Refactored to thread MiddlewarePipeline; fixed 204 null body for undici
- `packages/boot/package.json` — Added subpath exports for MiddlewarePipeline.js and middleware/*
