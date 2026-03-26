---
id: T01
parent: S05
milestone: M013
provides: []
requires: []
affects: []
key_files: ["packages/example-2-1-servers-express/src/middleware/AuthMiddleware.js", "packages/example-2-1-servers-express/main.js", "packages/example-2-1-servers-express/src/controllers.js"]
key_decisions: ["AuthMiddleware order:5 runs before RequestLoggerMiddleware order:10 so the 401 is logged with the right status", "Public routes /health and / skip auth explicitly in the handler"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Full workspace: 0 failing."
completed_at: 2026-03-26T12:07:42.531Z
blocker_discovered: false
---

# T01: AuthMiddleware added to Express example — protected routes, 401 on missing token

> AuthMiddleware added to Express example — protected routes, 401 on missing token

## What Happened
---
id: T01
parent: S05
milestone: M013
key_files:
  - packages/example-2-1-servers-express/src/middleware/AuthMiddleware.js
  - packages/example-2-1-servers-express/main.js
  - packages/example-2-1-servers-express/src/controllers.js
key_decisions:
  - AuthMiddleware order:5 runs before RequestLoggerMiddleware order:10 so the 401 is logged with the right status
  - Public routes /health and / skip auth explicitly in the handler
duration: ""
verification_result: passed
completed_at: 2026-03-26T12:07:42.531Z
blocker_discovered: false
---

# T01: AuthMiddleware added to Express example — protected routes, 401 on missing token

**AuthMiddleware added to Express example — protected routes, 401 on missing token**

## What Happened

Added AuthMiddleware to example-2-1. Added /secret protected route. Updated main.js to register AuthMiddleware as CDI component. Example demonstrates the full pattern.

## Verification

Full workspace: 0 failing.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm test --workspaces --if-present` | 0 | ✅ pass | 6600ms |


## Deviations

Example tests needed auth headers added (and two new auth-proving tests added) since AuthMiddleware is now active in the example context.

## Known Issues

None.

## Files Created/Modified

- `packages/example-2-1-servers-express/src/middleware/AuthMiddleware.js`
- `packages/example-2-1-servers-express/main.js`
- `packages/example-2-1-servers-express/src/controllers.js`


## Deviations
Example tests needed auth headers added (and two new auth-proving tests added) since AuthMiddleware is now active in the example context.

## Known Issues
None.
