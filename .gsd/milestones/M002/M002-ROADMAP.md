# M002: v3.0 Implementation

**Vision:** Transform the @alt-javascript framework from a basic IoC container into a production-grade DI framework with auto-discovery, AOP, events, conditional beans, and constructor injection — all in pure JavaScript ESM, in a monorepo structure.

## Success Criteria

- All 268 existing tests across all four packages pass after monorepo migration (74 boot + 38 cdi + 40 config + 116 logger)
- ApplicationContext supports BeanPostProcessor, events, auto-discovery, conditions, AOP, and constructor injection
- A single integrated scenario uses all new features together: auto-discovered, conditionally-registered, AOP-proxied component with event publishing and constructor injection
- Browser ESM bundle builds from the monorepo

## Key Risks / Unknowns

- Monorepo migration breaking existing inter-package resolution — all four packages import from each other via npm, workspace resolution may behave differently
- BeanPostProcessor integration into ApplicationContext — the existing lifecycle (`parseContextComponent` → `createReferenceInstance` → `wireProperties`) needs new hook points inserted correctly
- Rollup browser bundle generation from workspace packages — workspace `@alt-javascript/common` references need to be resolved or inlined

## Proof Strategy

- Monorepo resolution → retire in S01 by running all 268 existing tests through workspace resolution
- BeanPostProcessor hook points → retire in S02 by demonstrating events firing during real ApplicationContext lifecycle
- Browser bundles → retire in S04 by building rollup bundles from the monorepo

## Verification Classes

- Contract verification: mocha tests (existing + new feature tests)
- Integration verification: cross-package workspace imports, integrated ApplicationContext scenario
- Operational verification: rollup browser bundle generation
- UAT / human verification: user reviews API ergonomics of new features

## Milestone Definition of Done

This milestone is complete only when all are true:

- All 268+ existing tests pass in the monorepo
- Each P1 feature has dedicated tests proving it works
- An integrated test exercises auto-discovery → conditions → BeanPostProcessor → AOP → events → constructor injection together
- Browser ESM bundle builds without error
- All packages bumped to 3.0.0

## Requirement Coverage

- Covers: R013 (v3.0 implementation), R014 (monorepo migration)
- Partially covers: R004-R008 (production implementation of PoC features)
- Constraint compliance: R011 (flat ESM browser), R012 (pure JS only)
- Leaves for later: P2 improvements, CI/CD, documentation, npm publish

## Slices

- [x] **S01: Monorepo Migration + Common Package** `risk:high` `depends:[]`
  > After this: all 268 existing tests pass through npm workspaces with shared @alt-javascript/common; EphemeralConfig falsy bug fixed

- [x] **S02: BeanPostProcessor + Application Events** `risk:high` `depends:[S01]`
  > After this: ApplicationContext fires ContextRefreshedEvent/ContextClosedEvent during lifecycle; custom BeanPostProcessors can intercept bean creation

- [x] **S03: Auto-Discovery + Conditional Registration** `risk:medium` `depends:[S01]`
  > After this: components with static __component are auto-discovered; conditionalOnProperty/MissingBean/Bean filter registration

- [x] **S04: AOP + Constructor Injection + Integration** `risk:medium` `depends:[S02,S03]`
  > After this: AOP proxies applied via BeanPostProcessor; constructor args resolved from context; aware interfaces work; integrated scenario exercises all features together; browser bundles build

## Boundary Map

### S01 → S02, S03

Produces:
- npm workspaces root at `/Users/craig/src/github/alt-javascript/` with `packages: [boot, cdi, config, logger, common]`
- `@alt-javascript/common` package exporting `getGlobalRef`, `detectBrowser`, `getGlobalRoot`, `isPlainObject`
- All four packages importing from `@alt-javascript/common` instead of inline copies
- EphemeralConfig with `root !== null && root !== undefined` (falsy bug fixed)
- 268+ tests passing

Consumes:
- nothing (first slice)

### S02 → S04

Produces:
- `BeanPostProcessor` interface and lifecycle hooks in ApplicationContext
- `ApplicationEventPublisher` integrated as a context-managed component
- `ContextRefreshedEvent` and `ContextClosedEvent` published at appropriate lifecycle points
- Convention-based event listener detection (`onApplicationEvent` method)

Consumes:
- S01: monorepo with common package and working workspace resolution

### S03 → S04

Produces:
- `ApplicationContext.scan(classes)` method for auto-discovery
- `static __component` metadata processing during context preparation
- `evaluateConditions()` integrated into `parseContextComponent()` pipeline
- `conditionalOnProperty`, `conditionalOnMissingBean`, `conditionalOnBean` as importable functions

Consumes:
- S01: monorepo with common package

### S04 (terminal)

Produces:
- AOP proxy wrapping via BeanPostProcessor (`postProcessAfterInitialization`)
- Constructor injection via `constructorArgs` component property
- Aware interfaces: `setApplicationContext(ctx)` called during initialization
- Integrated test scenario exercising all features
- Browser ESM bundle built via rollup

Consumes:
- S02: BeanPostProcessor + events
- S03: auto-discovery + conditions
