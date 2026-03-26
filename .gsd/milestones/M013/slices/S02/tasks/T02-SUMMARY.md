---
id: T02
parent: S02
milestone: M013
provides: []
requires: []
affects: []
key_files: ["packages/boot/index.js", "packages/boot-express/index.js", "packages/boot-fastify/index.js", "packages/boot-hono/index.js", "packages/boot-koa/index.js", "packages/boot-lambda/index.js", "packages/boot-azure-function/index.js", "packages/boot-cloudflare-worker/index.js"]
key_decisions: ["All 7 starters updated — server and serverless adapters both include middleware so consumers don't need to wire them manually"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "node --input-type=module confirms expressStarter() and lambdaStarter() both return the 4 expected component names."
completed_at: 2026-03-26T11:54:28.430Z
blocker_discovered: false
---

# T02: Wired built-in middleware into all 7 *Starter() functions

> Wired built-in middleware into all 7 *Starter() functions

## What Happened
---
id: T02
parent: S02
milestone: M013
key_files:
  - packages/boot/index.js
  - packages/boot-express/index.js
  - packages/boot-fastify/index.js
  - packages/boot-hono/index.js
  - packages/boot-koa/index.js
  - packages/boot-lambda/index.js
  - packages/boot-azure-function/index.js
  - packages/boot-cloudflare-worker/index.js
key_decisions:
  - All 7 starters updated — server and serverless adapters both include middleware so consumers don't need to wire them manually
duration: ""
verification_result: passed
completed_at: 2026-03-26T11:54:28.430Z
blocker_discovered: false
---

# T02: Wired built-in middleware into all 7 *Starter() functions

**Wired built-in middleware into all 7 *Starter() functions**

## What Happened

Added middleware exports to packages/boot/index.js and updated all 7 adapter starter functions to include the three CDI middleware components with conditionalOnMissingBean semantics.

## Verification

node --input-type=module confirms expressStarter() and lambdaStarter() both return the 4 expected component names.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `node --input-type=module -e "import { expressStarter } from './packages/boot-express/index.js'; console.log(expressStarter().map(c=>c.name).join(', '));"` | 0 | ✅ pass | 200ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `packages/boot/index.js`
- `packages/boot-express/index.js`
- `packages/boot-fastify/index.js`
- `packages/boot-hono/index.js`
- `packages/boot-koa/index.js`
- `packages/boot-lambda/index.js`
- `packages/boot-azure-function/index.js`
- `packages/boot-cloudflare-worker/index.js`


## Deviations
None.

## Known Issues
None.
