# M002: v3.0 Implementation

**Gathered:** 2026-03-18
**Status:** Ready for planning

## Project Description

Implement the P1 improvements recommended by M001's gap analysis and validated by PoC spikes. This transforms the @alt-javascript framework from a basic IoC container into a production-grade DI framework with Spring-like capabilities — all in pure JavaScript ESM.

## Why This Milestone

M001 proved feasibility — 4 PoC spikes working, monorepo prototype validated, gap analysis complete. Now we implement for real. The author is the primary consumer (D003), so v3.0 breaking changes are fine. The current 2.x is functional but missing too many core features compared to Spring to be compelling for broader adoption.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Install `@alt-javascript/cdi@3.0.0` and use auto-discovery, AOP, events, conditional beans, constructor injection, and aware interfaces
- Import from `@alt-javascript/common` for shared utility functions
- Use a monorepo structure with npm workspaces for coordinated development

### Entry point / environment

- Entry point: `npm install @alt-javascript/boot@3.0.0` / `import { Boot } from '@alt-javascript/boot'`
- Environment: Node.js (primary) + browser ESM (must work)
- Live dependencies involved: none (framework library)

## Completion Class

- Contract complete means: All existing tests pass after migration + new feature tests pass for each P1 improvement
- Integration complete means: Cross-package imports work via npm workspaces, ApplicationContext uses events/AOP/conditions/discovery in an integrated scenario
- Operational complete means: `npm publish` readiness for all packages (not actually publishing)

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- An application using auto-discovered, conditionally-registered, AOP-proxied components boots and runs correctly with the event system delivering lifecycle events
- All existing tests in all four packages still pass (no regressions from monorepo migration)
- Browser ESM bundles can be built via rollup from the monorepo structure

## Risks and Unknowns

- Monorepo migration may break CI or existing consumer imports — need careful package.json/exports mapping
- BeanPostProcessor integration into ApplicationContext lifecycle is the most complex change — if the hook points are wrong, AOP and events won't wire correctly
- Rollup browser bundles need to resolve workspace package references — may need special config
- EphemeralConfig falsy-value fix could have subtle downstream effects in existing tests

## Existing Codebase / Prior Art

- `poc/AutoDiscovery.js` — validated auto-discovery API (17 tests)
- `poc/Aop.js` — validated AOP proxy API (14 tests)
- `poc/Events.js` — validated event system API (13 tests)
- `poc/Conditions.js` — validated condition evaluation API (21 tests)
- `poc/monorepo/` — validated npm workspaces structure (8 tests)
- `../cdi/ApplicationContext.js` — the primary integration target for all new features
- `../config/EphemeralConfig.js` — contains the falsy-value bug to fix

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- R013 — v3.0 Implementation of Recommended Improvements (currently deferred, activating now)
- R014 — Monorepo Migration Execution (currently deferred, activating now)
- R011 — Pure JS Flat ESM Browser Constraint (constraint — must be maintained)
- R012 — Pure JavaScript Only (constraint — must be maintained)

## Scope

### In Scope

- Monorepo migration (consolidate 4 repos into workspaces)
- Shared @alt-javascript/common package
- BeanPostProcessor hooks in ApplicationContext
- Application event system integration
- Component auto-discovery integration
- Conditional bean registration integration
- AOP via Proxy integration with BeanPostProcessor
- Constructor injection + aware interfaces
- EphemeralConfig falsy-value bug fix
- Rollup browser bundle generation from monorepo
- Version bump to 3.0.0 for all packages

### Out of Scope / Non-Goals

- P2 improvements (environment abstraction, circular dep detection, etc.)
- npm publish (just readiness)
- CI/CD pipeline setup
- TypeScript type definitions
- Documentation/README updates beyond code comments
- Changelog generation

## Technical Constraints

- Pure JavaScript only (D002)
- Flat ESM browser support (R011)
- No native decorators (D005)
- v3.0 breaking changes OK (D003)
- npm workspaces monorepo (D006)

## Integration Points

- `@alt-javascript/common` → imported by boot, cdi, config, logger
- `@alt-javascript/cdi` ApplicationContext → integrates events, AOP, conditions, discovery
- `@alt-javascript/config` EphemeralConfig → falsy-value bug fix
- rollup → browser bundle generation from monorepo workspace packages

## Open Questions

- How to handle git history: squash-merge 4 repos into one, or subtree merge? — leaning toward fresh monorepo with PoC code moved in, since v3.0 is a clean break
- Should the monorepo live in the boot repo or a new repo? — leaning new repo since it's fundamentally different structure
