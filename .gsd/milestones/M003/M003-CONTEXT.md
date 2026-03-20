# M003: P2 Features + Config Refactoring

**Gathered:** 2026-03-19
**Status:** Ready for planning

## Why This Milestone

M002 delivered the P1 features — the framework now has BeanPostProcessor, events, auto-discovery, conditions, AOP, constructor injection, and aware interfaces. P2 features add robustness and developer experience improvements that make the framework production-ready. The config package also needs refactoring to clean up its internal architecture before v3.0 ships.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Get clear error messages when circular dependencies exist (instead of infinite loops or stack overflows)
- Use `primary: true` to designate a preferred bean when multiple implementations exist
- Use `dependsOn: ['otherBean']` to control initialization ordering
- Use `@DependsOn` to ensure dependent beans are initialized first
- Use a cleaner, more consistent config API
- Get better startup error messages with failure context

### Entry point / environment

- Entry point: `ApplicationContext.start()` / `Boot.boot()`
- Environment: Node.js + browser ESM
- Live dependencies involved: none

## Completion Class

- Contract complete means: each P2 feature has dedicated tests proving it works
- Integration complete means: P2 features compose with P1 features in ApplicationContext
- Operational complete means: none (library, not a running service)

## Final Integrated Acceptance

- All P2 features work alongside P1 features without regression
- Config refactoring maintains full backward compatibility (44 existing tests pass)
- 276+ tests all pass

## Risks and Unknowns

- Circular dependency detection may have edge cases with factories/prototypes
- Config refactoring scope could expand — need to timebox it
- `@Primary` interaction with conditions and profiles needs careful design

## Existing Codebase / Prior Art

- `packages/cdi/ApplicationContext.js` — all lifecycle modifications go here
- `packages/config/` — 16 source files, ValueResolvingConfig/DelegatingConfig are the core
- `packages/cdi/context/Component.js` — component definition shape
- `.gsd/milestones/M001/slices/S04/S04-RECOMMENDATIONS.md` — P2 feature list

## Relevant Requirements

- R013 — v3.0 implementation (P2 features are part of this)

## Scope

### In Scope

- Circular dependency detection (P2 #9)
- Initialization ordering / `dependsOn` (P2 #10)
- `primary: true` on component definitions (P2 #11)
- Failure analyzers — better startup error messages (P2 #13)
- Lifecycle interfaces — formal start/stop (P2 #14)
- Config package refactoring — clean up internal architecture, consistent API
- Graceful shutdown ordering (P2 #15)

### Out of Scope / Non-Goals

- Collection injection (P2 #12) — low value, defer
- ApplicationRunner / CommandLineRunner (P2 #16) — low value, existing `run` phase sufficient
- Config property binding (P2 #17) — medium effort, defer to M004
- AOP pointcut expressions (P2 #18) — medium effort, current matching is sufficient
- BeanFactoryPostProcessor (P2 #19) — medium effort, defer
- Environment abstraction (P2 #8) — profiles already work, unified env is a larger design effort
- CI/CD, docs, npm publish — that's M004

## Technical Constraints

- Pure JavaScript ESM
- Flat browser ESM (no bundler required)
- Backward compatibility with all 276 existing tests
