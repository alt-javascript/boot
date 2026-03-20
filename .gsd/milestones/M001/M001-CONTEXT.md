# M001: Spring Core Gap Analysis & PoC Spikes

**Gathered:** 2026-03-18
**Status:** Ready for planning

## Project Description

Systematic gap analysis of the `@alt-javascript` core framework (boot, cdi, config, logger) against Spring Framework core and Spring Boot core features, followed by working PoC spikes for the highest-value improvements. The framework is a pure JavaScript IoC/DI framework inspired by Spring, running isomorphically in Node.js and as flat ESM in the browser.

## Why This Milestone

The framework works but has known structural gaps versus the Spring patterns it draws from. Nobody has systematically mapped what's missing, what's partial, and what's already covered. Without this analysis, improvement work is ad-hoc — picking features that seem interesting rather than addressing the gaps that matter most. The PoC spikes prove feasibility in pure JS before committing to a full implementation effort.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Read a comprehensive gap analysis mapping Spring Framework core + Spring Boot core features against the existing four packages
- See working PoC code proving the top improvements are feasible in pure JS without a transpiler
- Reference a prioritized v3.0 recommendation document to plan the implementation milestone
- Evaluate a monorepo prototype to decide whether to proceed with migration

### Entry point / environment

- Entry point: gap analysis documents in `.gsd/`, PoC spike code in project source
- Environment: local dev (Node.js), browser ESM verification
- Live dependencies involved: none — this is library/framework analysis

## Completion Class

- Contract complete means: gap analysis document exists with ratings, PoC spikes have passing tests
- Integration complete means: PoC spikes work within the existing test harness and module structure
- Operational complete means: none — no deployment or service lifecycle

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- Every major Spring Framework core and Spring Boot core feature has been mapped and rated
- Top 3-5 improvements have working PoC code with tests
- Monorepo viability has been tested with a working prototype or rejected with evidence
- A prioritized v3.0 recommendation document synthesizes all findings

## Risks and Unknowns

- Stage 3 decorators not natively available in JS engines — decorator-based patterns are off the table for pure JS, forcing alternative approaches for component marking
- Auto-discovery of components may be fundamentally limited by ESM's static module graph — there's no classpath scanning equivalent in JavaScript
- AOP via Proxy may have performance implications in hot paths that make it unsuitable for some use cases
- Monorepo migration may surface unforeseen circular dependency issues between the four packages

## Existing Codebase / Prior Art

- `Boot.js` — bootstrap, global context setup, environment detection
- `ApplicationContext.js` (cdi) — IoC container, component lifecycle, autowiring, profiles
- `context/Component.js`, `Singleton.js`, `Prototype.js`, `Service.js` — component type hierarchy
- `ConfigFactory.js`, `ValueResolvingConfig.js` (config) — hierarchical config, placeholder resolution
- `LoggerFactory.js` (logger) — pluggable logging with global context detection
- `getGlobalRef`/`detectBrowser`/`getGlobalRoot` — duplicated across Boot.js, ApplicationContext.js, ConfigFactory.js, LoggerFactory.js
- Adjacent modules at `../cdi`, `../config`, `../logger` — full source available

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- R001-R003 — Gap analysis coverage and ratings
- R004 — Component auto-discovery PoC
- R005-R008 — Container enhancement PoCs (AOP, events, lifecycle, conditional beans)
- R009 — Monorepo evaluation
- R010 — Prioritized recommendations
- R011-R012 — Pure JS and flat ESM constraints

## Scope

### In Scope

- Spring Framework core: IoC container, DI, bean scopes, bean lifecycle, BeanPostProcessor, events (ApplicationEventPublisher), Environment/profiles, property sources, SpEL (expression language), AOP (method interception, advice types), resource abstraction, aware interfaces
- Spring Boot core: auto-configuration, @Conditional* annotations, starter conventions, externalized config (application.properties/yml), actuator health/info, banner/startup, failure analyzers
- The four packages: boot, cdi, config, logger
- PoC spikes for top improvements
- Monorepo evaluation and prototype
- Prioritized v3.0 recommendations

### Out of Scope / Non-Goals

- Spring WebMVC, Spring Data/JDBC, Spring Security, Spring Cloud, or any non-core Spring module
- `@alt-javascript/jasypt` (not part of Spring, standalone port)
- Actual v3.0 implementation (that's a follow-on milestone)
- TypeScript migration or TypeScript-dependent features
- Full monorepo migration (prototype only in this milestone)

## Technical Constraints

- Pure JavaScript — no TypeScript compile step
- Flat ESM — must work as direct ES module imports in browser without bundler
- Node 24 does not expose `Symbol.metadata` natively — decorator syntax is not available without transpiler
- Existing test infrastructure: mocha + chai, config via `node-config` package

## Integration Points

- Adjacent module source at `../cdi`, `../config`, `../logger` — read for analysis, potentially modified for PoC spikes
- npm registry — published packages for reference
- No external services or APIs

## Open Questions

- What's the best JS-idiomatic alternative to annotation-based component scanning? Static class properties? Convention-based file scanning? Registration helpers?
- Can Proxy-based AOP be performant enough for production use, or should the framework offer it as opt-in?
- Should the event system build on Node's EventEmitter or be a standalone implementation for isomorphic use?
- Is npm workspaces sufficient for the monorepo, or does it need a tool like turborepo/nx?
