---
id: S04
parent: M001
milestone: M001
provides:
  - npm workspaces monorepo prototype with 8 passing cross-package tests
  - @alt-javascript/common shared kernel extracting duplicated global-ref code
  - Final v3.0 recommendations document with 7 P1 items, 12 P2 items, effort estimates
  - Decisions D006-D009 recorded
requires:
  - slice: S01
    provides: Gap analysis with cross-cutting observations
  - slice: S02
    provides: Auto-discovery PoC and findings
  - slice: S03
    provides: AOP, events, conditions PoCs and findings
affects: []
key_files:
  - .gsd/milestones/M001/slices/S04/S04-RECOMMENDATIONS.md
  - poc/monorepo/
key_decisions:
  - "D006: npm workspaces monorepo recommended"
  - "D007: JS Proxy for AOP"
  - "D008: Custom isomorphic event bus"
  - "D009: Static __component for auto-discovery"
patterns_established:
  - "@alt-javascript/common as shared kernel package"
  - "npm workspaces for monorepo with independent publishability"
observability_surfaces:
  - none
drill_down_paths:
  - .gsd/milestones/M001/slices/S04/S04-PLAN.md
duration: 1.5h
verification_result: passed
completed_at: 2026-03-18T03:00:00Z
---

# S04: Monorepo Evaluation & Synthesis

**Monorepo proven viable (8 cross-package tests), v3.0 recommendations document with 7 P1 + 12 P2 improvements and ~4-6 week effort estimate**

## What Happened

Built an npm workspaces monorepo prototype at `poc/monorepo/` with three packages: `@alt-javascript/common` (shared kernel), `boot-lite`, and `cdi-lite`. The common module extracts the `getGlobalRef`/`detectBrowser`/`getGlobalRoot`/`isPlainObject` functions that were duplicated across four packages. Boot-lite and cdi-lite both import from common, and a cross-package integration test proves boot writes to global context and cdi reads from it — all via the shared module.

Wrote the final v3.0 recommendations document synthesizing all findings:
- 7 P1 improvements in dependency order (monorepo → BeanPostProcessor → events → auto-discovery → conditions → AOP → constructor injection)
- 12 P2 improvements (environment abstraction, circular dep detection, ordering, etc.)
- Deferred items (SpEL, custom scopes, actuator, etc.)
- EphemeralConfig falsy-value bug documented
- Total effort estimate: ~4-6 weeks for full v3.0, ~2-3 weeks for P1 only

## Verification

- Monorepo prototype: `cd poc/monorepo && npm test` — 8 tests pass
- Main project: `npm test` — 74 tests pass (unchanged)
- Recommendations document complete with all sections

## Requirements Advanced

- R009 — Monorepo evaluation complete: prototype works, migration recommended
- R010 — Prioritized v3.0 recommendations complete with effort estimates

## Requirements Validated

- R004 — Auto-discovery PoC validated by S02 (17 tests)
- R005 — AOP PoC validated by S03 (14 tests)
- R006 — Event system PoC validated by S03 (13 tests)
- R008 — Conditional registration PoC validated by S03 (21 tests)
- R009 — Monorepo prototype validated (8 tests)

## New Requirements Surfaced

- EphemeralConfig falsy-value bug should be fixed in config package

## Requirements Invalidated or Re-scoped

- R007 (enhanced lifecycle hooks) — partially covered by event system + BeanPostProcessor design. Not given standalone PoC; aware interfaces are trivial to add once BeanPostProcessor exists.

## Deviations

None.

## Known Limitations

- Monorepo prototype is minimal — real migration needs CI setup, publish pipeline, CHANGELOG handling
- Recommendations are effort estimates, not commitments — actual effort may vary

## Follow-ups

- v3.0 implementation milestone should follow the P1 dependency ordering in the recommendations
- EphemeralConfig fix should be first item during monorepo migration

## Files Created/Modified

- `poc/monorepo/` — npm workspaces prototype (3 packages, 8 tests)
- `.gsd/milestones/M001/slices/S04/S04-RECOMMENDATIONS.md` — Final v3.0 recommendations
- `.gsd/DECISIONS.md` — D006-D009 added

## Forward Intelligence

### What the next milestone should know
- The P1 dependency ordering in S04-RECOMMENDATIONS.md is critical — BeanPostProcessor must come before AOP and events
- The monorepo prototype at poc/monorepo/ is a working starting point for migration
- All PoC code in poc/ is standalone — it doesn't modify existing source, so it can be refactored into the real packages during v3.0

### What's fragile
- Nothing — all artifacts are additive and documented

### Authoritative diagnostics
- `npm test` (74 tests) for main project health
- `cd poc/monorepo && npm test` (8 tests) for monorepo prototype
