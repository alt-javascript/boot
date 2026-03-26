---
id: S01
parent: M013
milestone: M013
provides:
  - MiddlewarePipeline.compose(instances, finalHandler) — usable by all 7 adapters
  - MiddlewarePipeline.collect(ctx) — CDI scanner for middleware components
requires:
  []
affects:
  - S02
  - S03
  - S04
key_files:
  - packages/boot/MiddlewarePipeline.js
  - packages/boot/index.js
  - packages/boot/test/MiddlewarePipeline.spec.js
key_decisions:
  - compose() executes in array order; collect() owns sorting
  - Infinity default for unordered middleware places them innermost (closest to handler)
patterns_established:
  - CDI middleware components declare static __middleware = { order: N } — symmetric with __routes convention
  - collect() scans + sorts; compose() is pure functional — separation of CDI concern from execution concern
observability_surfaces:
  - none
drill_down_paths:
  - packages/boot/test/MiddlewarePipeline.spec.js
duration: ""
verification_result: passed
completed_at: 2026-03-26T11:50:52.825Z
blocker_discovered: false
---

# S01: Core Pipeline \u2014 MiddlewarePipeline compose utility

**Core MiddlewarePipeline compose utility — framework-agnostic, CDI-aware, fully tested**

## What Happened

Delivered the pure-functional MiddlewarePipeline utility in packages/boot. compose() builds an onion chain; collect() scans CDI context and sorts by __middleware.order. 22 passing tests, no regressions.

## Verification

npm test -w packages/boot: 22 passing, 0 failing.

## Requirements Advanced

None.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

compose() does not sort — that responsibility lives entirely in collect(). Simpler and easier to test both in isolation.

## Known Limitations

None.

## Follow-ups

None.

## Files Created/Modified

- `packages/boot/MiddlewarePipeline.js` — New: pure-functional middleware compose utility with collect() CDI scanner
- `packages/boot/index.js` — Added MiddlewarePipeline export
- `packages/boot/test/MiddlewarePipeline.spec.js` — New: 13 unit tests covering compose and collect
