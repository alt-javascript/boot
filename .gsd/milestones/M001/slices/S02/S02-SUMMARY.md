---
id: S02
parent: M001
milestone: M001
provides:
  - AutoDiscovery.js — pure JS component auto-discovery via static class properties
  - scan() function for batch discovery from class arrays
  - ComponentRegistry for programmatic registration of third-party classes
  - discover() for merging scan + registry results
  - 17 tests proving integration with ApplicationContext scopes and profiles
requires:
  - slice: S01
    provides: Gap analysis identifying auto-discovery as P1 priority
affects:
  - S04
key_files:
  - poc/AutoDiscovery.js
  - test/autodiscovery.spec.js
key_decisions:
  - "Static __component property as primary discovery mechanism — no decorators, no transpiler"
  - "Explicit class array rather than filesystem scanning — ESM has no classpath"
  - "Double-underscore prefix (__component) to avoid collision with user properties"
patterns_established:
  - "static __component = {scope, profiles, ...} for class metadata declaration"
  - "scan() + discover() API for auto-discovery"
observability_surfaces:
  - none
drill_down_paths:
  - .gsd/milestones/M001/slices/S02/tasks/T01-SUMMARY.md
  - .gsd/milestones/M001/slices/S02/tasks/T02-SUMMARY.md
duration: 1h
verification_result: passed
completed_at: 2026-03-18T02:10:00Z
---

# S02: Component Auto-Discovery PoC

**Pure JS auto-discovery via static class properties — scan/discover/registry API with 17 passing tests including ApplicationContext integration**

## What Happened

Proved that components can self-declare via `static __component = {scope: 'singleton'}` and be discovered by a `scan()` function without any `new Component()` boilerplate. The mechanism works in pure JS ESM, requires no decorators or transpiler, and integrates cleanly with the existing ApplicationContext — including autowiring, prototype scopes, and profile filtering.

Three forms supported: `static __component = true` (singleton default), `static __component = 'prototype'` (string shorthand), and `static __component = {scope, profiles, ...}` (full options). A `ComponentRegistry` provides programmatic registration for classes you don't control. The `discover()` function merges both sources.

Key insight: the scan takes an explicit array of classes — not filesystem scanning. ESM has no classpath concept, so the consumer must bring their classes to the scanner. The improvement is in *declaration ergonomics* (static property vs manual wrapping), not in magical filesystem discovery. For a v3.0, auto-configuration modules could export their classes in an array, similar to Spring Boot's `AutoConfiguration.imports`.

## Verification

- 17 new tests pass: `npx mocha --require test/fixtures/index.js test/autodiscovery.spec.js`
- Full suite: 26 tests pass with `npm test` — zero regressions
- Integration proven: scan → Context → ApplicationContext → autowiring → retrieval all work

## Requirements Advanced

- R004 — Component auto-discovery PoC complete: working spike without transpiler

## Requirements Validated

- None — PoC proves feasibility, not production readiness

## New Requirements Surfaced

- None

## Requirements Invalidated or Re-scoped

- None

## Deviations

None — executed as planned.

## Known Limitations

- Consumer must provide the class array — no automatic module graph traversal
- No support for discovering components from `node_modules` (would need a manifest convention)
- The __component property name is a convention, not enforced — could collide in theory

## Follow-ups

- S04 synthesis should evaluate whether `__component` or a different property name is best
- Future milestone: ApplicationContext could accept `discover()` output directly instead of requiring `new Context(components.map(c => new Component(c)))` wrapping

## Files Created/Modified

- `poc/AutoDiscovery.js` — Auto-discovery implementation (scan, discover, ComponentRegistry)
- `test/autodiscovery.spec.js` — 17 comprehensive tests

## Forward Intelligence

### What the next slice should know
- The scan/discover API produces plain objects with `{Reference, name, scope, profiles, ...}` — these map 1:1 to Component constructor options
- The integration test proves these work through `new Component(scannedDef)` → Context → ApplicationContext — no changes needed to ApplicationContext itself

### What's fragile
- Nothing in this slice is fragile — it's additive only, no existing files modified

### Authoritative diagnostics
- `test/autodiscovery.spec.js` is the definitive proof — run it to verify the mechanism works

### What assumptions changed
- Originally considered filesystem scanning as a possibility — confirmed it's not viable in ESM (no classpath). Explicit class arrays are the right model.
