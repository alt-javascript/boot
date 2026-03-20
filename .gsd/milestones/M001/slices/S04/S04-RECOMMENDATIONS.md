# v3.0 Recommendations — @alt-javascript Framework

## Executive Summary

The gap analysis (S01) mapped 85 Spring Framework core + Spring Boot core features against the four @alt-javascript packages. Of these, 6 have full coverage, 14 partial, and 65 none. Three PoC spikes proved the highest-value improvements work in pure JS: auto-discovery via static class properties (S02), Proxy-based AOP, isomorphic events, and conditional bean registration (S03). A monorepo prototype (S04) proved npm workspaces can eliminate the duplicated global-ref code and enable cross-package testing.

**Recommendation:** Proceed with a v3.0 that implements the P1 improvements in a monorepo structure. Breaking changes are acceptable (D003). The work should be sequenced as outlined below.

---

## Monorepo: Recommended

**Verdict:** Migrate to npm workspaces monorepo.

**Evidence:**
- Prototype at `poc/monorepo/` proves: shared `@alt-javascript/common` package, npm workspaces linking, cross-package tests passing (8 tests)
- Eliminates 4 copies of `getGlobalRef`/`detectBrowser`/`getGlobalRoot` (~80 lines of duplication)
- Eliminates 2 copies of `isPlainObject` (DelegatingConfig + JSONFormatter)
- Enables coordinated versioning across all packages
- Eliminates circular test dependencies — common module breaks the cycle
- Each package remains independently publishable to npm

**Structure:**
```
alt-javascript/
  packages/
    common/     — shared kernel (global-ref, env detection, utilities)
    boot/       — bootstrap + Application
    cdi/        — ApplicationContext, components, lifecycle
    config/     — config resolution, placeholder, property sources
    logger/     — logging, formatters, factories
  package.json  — workspaces root
```

**Migration effort:** ~1 week. Mostly mechanical: move repos, set up workspaces, update imports, verify tests.

---

## P1 Improvements — v3.0 Implementation Order

These should be implemented in dependency order. Each builds on the previous.

### 1. Monorepo Migration + Shared Common Module
**Effort:** Medium (3-5 days)
**Covers:** Code deduplication, version coordination, test infrastructure
**What:** Consolidate four repos into one. Extract `@alt-javascript/common` with `getGlobalRef`, `detectBrowser`, `getGlobalRoot`, `isPlainObject`. Update all four packages to import from common.
**Dependencies:** None — this is the foundation.

### 2. BeanPostProcessor
**Effort:** Medium (2-3 days)
**Covers:** Spring 1.3.4, 1.7.8 — enables AOP, aware interfaces, validation
**What:** Add `postProcessBeforeInitialization(instance, name)` and `postProcessAfterInitialization(instance, name)` hooks into the ApplicationContext lifecycle. Called between creation/injection and initialization for every singleton. This is the architectural keystone — AOP proxying (item 6) hooks in here.
**Dependencies:** Monorepo (for cross-package changes)

### 3. Application Event System
**Effort:** Low-Medium (1-2 days)
**Covers:** Spring 1.4.1–1.4.4, 2.6.3
**What:** Integrate `poc/Events.js` into ApplicationContext. Register `ApplicationEventPublisher` as a context component. Publish `ContextRefreshedEvent` after prepare() completes, `ContextClosedEvent` during destroy. Allow components to subscribe via convention (`onApplicationEvent` method) or explicit `on()`.
**PoC:** `poc/Events.js` — 13 tests passing
**Dependencies:** BeanPostProcessor (for event-listener auto-detection)

### 4. Component Auto-Discovery
**Effort:** Medium (2-3 days)
**Covers:** Spring 2.1.1–2.1.3
**What:** Integrate `poc/AutoDiscovery.js` into ApplicationContext. Add `ApplicationContext.scan(classes)` method. Support `static __component` metadata. Add `discover()` as a convenience that merges scan + registry.
**PoC:** `poc/AutoDiscovery.js` — 17 tests passing
**Dependencies:** Monorepo (for consistent API across packages)

### 5. Conditional Bean Registration
**Effort:** Low-Medium (1-2 days)
**Covers:** Spring 2.2.1–2.2.3, 2.2.6
**What:** Integrate `poc/Conditions.js` into ApplicationContext. Evaluate `condition` property on component definitions during `parseContextComponent()`. Add `conditionalOnProperty`, `conditionalOnMissingBean`, `conditionalOnClass` as framework exports.
**PoC:** `poc/Conditions.js` — 21 tests passing
**Dependencies:** Monorepo

### 6. AOP via Proxy
**Effort:** Medium (2-3 days)
**Covers:** Spring 1.7.1–1.7.6
**What:** Integrate `poc/Aop.js` with BeanPostProcessor. During `postProcessAfterInitialization`, if aspects are defined for a component, wrap it in `createProxy()`. Aspects defined via context configuration or `static __aspects` on classes. Support pointcut matching by name, wildcard, regex.
**PoC:** `poc/Aop.js` — 14 tests passing
**Dependencies:** BeanPostProcessor (item 2)

### 7. Constructor Injection + Aware Interfaces
**Effort:** Medium (2-3 days)
**Covers:** Spring 1.1.3, 1.3.9
**What:** Add constructor argument specification to Component definition: `constructorArgs: ['config', 'loggerFactory']` — resolved from context during creation. Implement aware interfaces via BeanPostProcessor: if bean has `setApplicationContext(ctx)`, call it with the context.
**Dependencies:** BeanPostProcessor (item 2), Monorepo

---

## P2 Improvements — After P1

| # | Improvement | Effort | Covers |
|---|---|---|---|
| 8 | Environment abstraction | Medium | Unified profiles + property sources |
| 9 | Circular dependency detection | Low | Error on circular singleton refs |
| 10 | Initialization ordering (`@DependsOn`) | Low | `dependsOn` property on components |
| 11 | `@Primary` equivalent | Low | `primary: true` on component |
| 12 | Collection injection | Low | Inject all components of a type |
| 13 | Failure analyzers | Low | Better startup error messages |
| 14 | Lifecycle interface (start/stop) | Low | Formal component lifecycle |
| 15 | Graceful shutdown | Medium | Ordered destroy, drain, cleanup |
| 16 | ApplicationRunner / CommandLineRunner | Low | Post-startup hooks |
| 17 | Config property binding | Medium | Typed config objects |
| 18 | AOP pointcut expressions | Medium | More powerful matching |
| 19 | BeanFactoryPostProcessor | Medium | Modify definitions before creation |

---

## Deferred — Not for v3.0

- SpEL (low ROI — JS template literals suffice)
- Custom scopes (rare need)
- Web scopes (request/session — out of core scope)
- Resource abstraction (JS has import/fetch/fs)
- Actuator endpoints (domain-specific)
- Relaxed config binding (node-config handles this)
- Banner/startup info (cosmetic)

---

## Bugs Discovered

### EphemeralConfig Falsy Value Bug
`EphemeralConfig.get()` uses `if (root)` which treats `false`, `0`, `""` as missing values. This should be `if (root !== null && root !== undefined)`. Discovered when conditions PoC tested `conditionalOnProperty('feature.enabled', false)`.

**Fix location:** `@alt-javascript/config/EphemeralConfig.js` line 20
**Priority:** P1 — fix during monorepo migration

---

## Constraint Reminders

- **Pure JavaScript only** (D002) — no TypeScript compile step
- **Flat ESM browser** (R011) — must work as direct ESM imports without bundler
- **No native decorators** (D005) — until Stage 4 ships in engines, all metadata via static class properties or registration helpers
- **v3.0 breaking changes OK** (D003) — primary consumer is author's own projects

---

## Estimated Total Effort

| Phase | Items | Effort |
|---|---|---|
| Monorepo migration | Item 1 | 3-5 days |
| P1 core improvements | Items 2-7 | 10-17 days |
| P2 improvements | Items 8-19 | 8-12 days |
| **Total v3.0** | **All P1 + P2** | **~4-6 weeks** |

P1 alone (monorepo + 6 improvements) would deliver the highest-value 80% in roughly 2-3 weeks.
