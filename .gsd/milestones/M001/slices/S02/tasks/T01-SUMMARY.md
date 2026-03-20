---
id: T01
parent: S02
milestone: M001
provides:
  - AutoDiscovery.js — pure JS component auto-discovery mechanism
  - Three approaches: scan (static properties), ComponentRegistry (programmatic), discover (merged)
  - 17 passing tests covering scan, registry, integration with ApplicationContext
requires:
  - slice: S01
    provides: Gap analysis identifying auto-discovery as P1 priority
affects: [S04]
key_files:
  - poc/AutoDiscovery.js
  - test/autodiscovery.spec.js
key_decisions:
  - "Static class properties (__component) chosen as primary mechanism — most annotation-like, co-located, no tooling required"
  - "ComponentRegistry as complementary for third-party classes and programmatic use"
  - "COMPONENT_META_KEY = '__component' — double-underscore to avoid collision with user properties"
patterns_established:
  - "Static __component = {scope, profiles, ...} for class-level metadata declaration"
  - "scan([classes]) for discovery, discover([classes]) for scan+registry merge"
drill_down_paths:
  - .gsd/milestones/M001/slices/S02/S02-PLAN.md
duration: 45min
verification_result: pass
completed_at: 2026-03-18T02:00:00Z
---

# T01: Design and implement auto-discovery mechanism

**Pure JS auto-discovery via static class properties — 17 passing tests including full ApplicationContext integration**

## What Happened

Evaluated three approaches for pure JS component marking:

1. **Static class properties** (`static __component = {scope: 'singleton'}`) — chosen as primary. Most declarative, co-located with the class, requires no external tooling, works in all JS engines that support static class fields (ES2022+).

2. **ComponentRegistry** — implemented as complementary. Useful for third-party classes you don't control, and for programmatic scenarios. Global singleton `defaultRegistry` plus per-instance registries.

3. **Module manifest convention** — deferred. Would require each module to export a list of its components, which is viable but more boilerplate than static properties.

The `scan()` function reads `__component` from an array of classes, normalizes the metadata (handles `true`, string shorthand, and full object forms), and returns component definitions compatible with `new Component()`. The `discover()` function merges scan results with the ComponentRegistry.

Key design decision: the scan function takes an *explicit array* of classes rather than trying to "scan" the filesystem or import map. This is intentional — ESM has no classpath concept, so the consumer must bring their classes. The ergonomic improvement is in *how* classes declare themselves (static property vs explicit wrapping), not in automatic filesystem discovery.

## Files Created/Modified

- `poc/AutoDiscovery.js` — scan(), discover(), ComponentRegistry, defaultRegistry
- `test/autodiscovery.spec.js` — 17 tests covering scan, registry, integration
