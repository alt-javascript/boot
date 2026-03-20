# M003: P2 Features + Config Refactoring

**Vision:** Make the @alt-javascript framework robust and developer-friendly with circular dependency detection, initialization ordering, primary beans, better error messages, formal lifecycle, and a cleaner config package — all before shipping v3.0.

## Success Criteria

- Circular dependencies are detected at startup with a clear error message naming the cycle
- `dependsOn` controls initialization order between singletons
- `primary: true` designates the preferred bean when multiple implementations exist for the same name
- Startup errors include bean name, phase, and context about what went wrong
- Config package internal architecture is cleaner with no behavioral changes
- All 276+ existing tests pass with zero regressions

## Key Risks / Unknowns

- Circular dependency detection edge cases with factories, prototypes, and conditional beans
- Config refactoring scope creep — need to timebox and focus on structural cleanup only

## Proof Strategy

- Circular dependency edge cases → retire in S01 by testing singletons, prototypes, factories, and conditional chains
- Config refactoring stability → retire in S03 by running all 44 existing config tests unchanged

## Verification Classes

- Contract verification: mocha tests (existing + new feature tests)
- Integration verification: P2 features compose correctly with P1 features from M002
- Operational verification: none
- UAT / human verification: user reviews error message quality

## Milestone Definition of Done

This milestone is complete only when all are true:

- All 276+ existing tests pass
- Each P2 feature has dedicated tests
- Config package refactored with all 44 tests still passing
- Error messages for circular deps, missing beans, and startup failures are informative

## Requirement Coverage

- Covers: R013 (v3.0 implementation — P2 portion)
- Leaves for later: CI/CD, documentation, npm publish (M004)

## Slices

- [x] **S01: Circular Dependency Detection + Initialization Ordering** `risk:high` `depends:[]`
  > After this: circular singleton dependencies produce a clear error naming the cycle; `dependsOn` controls singleton initialization order

- [x] **S02: Primary Beans + Lifecycle + Error Messages** `risk:medium` `depends:[S01]`
  > After this: `primary: true` resolves ambiguity; singletons with `start()`/`stop()` participate in formal lifecycle; startup errors include bean name and phase

- [x] **S03: Config Package Refactoring** `risk:medium` `depends:[]`
  > After this: config package internals are cleaner — reduced class count, consistent patterns, no behavior changes; all 44 config tests pass

## Boundary Map

### S01 → S02

Produces:
- Dependency graph built during `injectSingletonDependencies` — cycle detection with error message
- `dependsOn` property on component definitions, resolved during `initialiseSingletons`
- Topological sort for initialization ordering

Consumes:
- nothing (first slice)

### S02 (builds on S01)

Produces:
- `primary: true` support in component definitions with resolution in `get()`
- `start()`/`stop()` lifecycle interface detection and invocation
- Enhanced error messages with bean name, lifecycle phase, and context

Consumes:
- S01: dependency graph (for ordering)

### S03 (independent)

Produces:
- Simplified config package internals
- Unchanged public API (DelegatingConfig, EphemeralConfig, ValueResolvingConfig, ConfigFactory)
- All 44 existing config tests passing unchanged

Consumes:
- nothing (independent of S01/S02)
