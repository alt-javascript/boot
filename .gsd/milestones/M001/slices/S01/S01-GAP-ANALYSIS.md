# M001/S01: Spring Core & Boot Gap Analysis

## Overview

This document maps Spring Framework core and Spring Boot core features against the `@alt-javascript` packages (boot, cdi, config, logger). Each feature is rated on four dimensions:

- **Coverage**: full | partial | none | n/a — what @alt-javascript currently implements
- **Relevance**: high | medium | low | n/a — how much this matters for a JS IoC framework
- **Feasibility**: high | medium | low | blocked — how hard to implement in pure JS (no transpiler, flat ESM browser)
- **Priority**: P1 | P2 | P3 | defer — recommended priority for v3.0

---

## Part 1: Spring Framework Core

### 1.1 IoC Container & Dependency Injection

| # | Spring Feature | @alt-js Coverage | Relevance | Feasibility | Priority | Notes |
|---|---|---|---|---|---|---|
| 1.1.1 | BeanFactory (basic container) | partial | high | high | P1 | ApplicationContext exists but no standalone lightweight BeanFactory |
| 1.1.2 | ApplicationContext | full | high | high | — | `ApplicationContext.js` implements this directly |
| 1.1.3 | Constructor injection | none | high | high | P1 | Spring's primary DI mode. CDI only does property injection post-construction. Constructor args could be passed via component definition. |
| 1.1.4 | Setter/property injection | full | high | high | — | Implemented via autowiring + Property wiring |
| 1.1.5 | Field injection | partial | medium | high | — | Implicit null-matching is effectively field injection, but fragile |
| 1.1.6 | Method injection (lookup method) | none | low | medium | P3 | Rarely needed in JS — closures serve the same purpose |
| 1.1.7 | `@Autowired` / explicit wiring | partial | high | high | P1 | String `'autowired'` marker works but is crude. Needs a cleaner API. |
| 1.1.8 | `@Qualifier` — named resolution | partial | high | high | P2 | `qualifier` property exists on Component but underused in autowiring |
| 1.1.9 | `@Primary` — default bean | none | medium | high | P2 | No way to mark a component as preferred when multiple match |
| 1.1.10 | Collection injection (inject all of type) | none | medium | high | P2 | Spring can inject `List<MyInterface>` — useful for plugin patterns |
| 1.1.11 | `@Lazy` — deferred initialization | none | medium | high | P3 | Singletons are always eagerly created |
| 1.1.12 | Circular dependency detection | none | medium | high | P2 | ApplicationContext doesn't detect or handle circular refs |
| 1.1.13 | `@DependsOn` — explicit ordering | none | medium | high | P2 | No way to control initialization order beyond insertion order |

### 1.2 Bean Scopes

| # | Spring Feature | @alt-js Coverage | Relevance | Feasibility | Priority | Notes |
|---|---|---|---|---|---|---|
| 1.2.1 | Singleton scope | full | high | high | — | Implemented |
| 1.2.2 | Prototype scope | full | high | high | — | Implemented |
| 1.2.3 | Request scope (web) | none | low | n/a | defer | Web-specific, out of scope for core |
| 1.2.4 | Session scope (web) | none | low | n/a | defer | Web-specific, out of scope for core |
| 1.2.5 | Custom scopes | none | medium | high | P3 | Spring allows registering custom scope implementations |

### 1.3 Bean Lifecycle

| # | Spring Feature | @alt-js Coverage | Relevance | Feasibility | Priority | Notes |
|---|---|---|---|---|---|---|
| 1.3.1 | `InitializingBean.afterPropertiesSet()` | partial | high | high | P1 | `init()` method exists but called by convention name only. Not called "after properties set" — called after creation + injection. Close enough. |
| 1.3.2 | `DisposableBean.destroy()` | partial | high | high | P1 | `destroy()` exists, registered on process signals. Needs cleanup — no graceful shutdown sequence. |
| 1.3.3 | `@PostConstruct` / `@PreDestroy` | none | high | high | P1 | No annotation equivalent; could use static property or convention |
| 1.3.4 | `BeanPostProcessor` | none | high | high | P1 | **Major gap.** No pre/post-processing hooks on bean creation. This is how Spring implements AOP proxying, validation, logging injection, etc. |
| 1.3.5 | `BeanFactoryPostProcessor` | none | high | high | P2 | No way to modify bean definitions before instantiation |
| 1.3.6 | `FactoryBean` | partial | medium | high | — | Factory function / wireFactory patterns partially cover this |
| 1.3.7 | Lifecycle interface (start/stop/isRunning) | none | medium | high | P2 | No formal component lifecycle beyond init/run/destroy |
| 1.3.8 | SmartLifecycle (phased startup/shutdown) | none | medium | medium | P3 | Ordered startup/shutdown phases — useful for complex apps |
| 1.3.9 | Aware interfaces (ApplicationContextAware, EnvironmentAware, etc.) | none | high | high | P1 | No way for a bean to receive container references. Currently everything goes through global state. |

### 1.4 Application Events

| # | Spring Feature | @alt-js Coverage | Relevance | Feasibility | Priority | Notes |
|---|---|---|---|---|---|---|
| 1.4.1 | `ApplicationEventPublisher` | none | high | high | P1 | **Major gap.** No event system within the container. |
| 1.4.2 | `@EventListener` | none | high | high | P1 | No declarative event subscription |
| 1.4.3 | Built-in events (ContextRefreshedEvent, ContextClosedEvent, etc.) | none | high | high | P1 | No lifecycle events published |
| 1.4.4 | Custom application events | none | high | high | P1 | No custom event support |
| 1.4.5 | Async event handling | none | medium | high | P2 | Would need async listener support |
| 1.4.6 | Ordered event listeners | none | low | high | P3 | Spring `@Order` on listeners |
| 1.4.7 | Generic event type matching | none | low | medium | defer | Spring uses generics for typed events — JS has no equivalent |

### 1.5 Environment, Profiles & Property Sources

| # | Spring Feature | @alt-js Coverage | Relevance | Feasibility | Priority | Notes |
|---|---|---|---|---|---|---|
| 1.5.1 | `Environment` abstraction | none | high | high | P1 | No unified Environment object. Profiles live in ApplicationContext, config is separate. |
| 1.5.2 | Active/default profiles | partial | high | high | P2 | Profiles exist but only for component activation — no default profile concept, no environment-wide profiles |
| 1.5.3 | `@Profile` on beans | partial | high | high | — | Implemented via component `profiles` property |
| 1.5.4 | PropertySource abstraction | none | high | high | P2 | No unified property source model. Config comes from node-config or EphemeralConfig. |
| 1.5.5 | `@PropertySource` — loading config files | none | medium | high | P3 | node-config handles this, but no programmatic source addition |
| 1.5.6 | Property placeholder resolution `${...}` | full | high | high | — | Implemented in PlaceHolderResolver and CDI autowiring |
| 1.5.7 | `@Value` injection | partial | high | high | P2 | `${path:default}` in constructor properties works, but not as clean as Spring's `@Value` |
| 1.5.8 | System environment / system properties | none | medium | high | P3 | No access to `process.env` through config abstraction |
| 1.5.9 | Config property validation | none | medium | high | P3 | No `@ConfigurationProperties` with validation |

### 1.6 SpEL (Spring Expression Language)

| # | Spring Feature | @alt-js Coverage | Relevance | Feasibility | Priority | Notes |
|---|---|---|---|---|---|---|
| 1.6.1 | Expression language for config/wiring | none | low | medium | defer | SpEL is powerful but complex. JS template literals and existing placeholder resolution cover most use cases. Low ROI for pure JS port. |
| 1.6.2 | Conditional expressions in config | none | low | medium | defer | Rare need in JS ecosystem |
| 1.6.3 | Method invocation in expressions | none | low | low | defer | Complex to implement safely |

### 1.7 AOP (Aspect-Oriented Programming)

| # | Spring Feature | @alt-js Coverage | Relevance | Feasibility | Priority | Notes |
|---|---|---|---|---|---|---|
| 1.7.1 | Method-level interception | none | high | high | P1 | JS `Proxy` can intercept method calls cleanly |
| 1.7.2 | Before advice | none | high | high | P1 | Trivial with Proxy `apply` trap |
| 1.7.3 | After advice (returning/throwing) | none | high | high | P1 | Proxy can catch returns and exceptions |
| 1.7.4 | Around advice | none | high | high | P1 | Most flexible — wraps entire method call |
| 1.7.5 | Pointcut expressions | none | medium | medium | P2 | Spring uses AspectJ syntax. JS could use name patterns, regex, or function predicates. |
| 1.7.6 | AOP proxy creation (JDK / CGLIB) | none | high | high | P1 | JS Proxy is the natural equivalent — no subclass generation needed |
| 1.7.7 | Introduction (adding interfaces) | none | low | medium | defer | Rare use case in JS |
| 1.7.8 | AOP via BeanPostProcessor | none | high | high | P1 | BeanPostProcessor is the mechanism that creates AOP proxies in Spring |

### 1.8 Resource Abstraction

| # | Spring Feature | @alt-js Coverage | Relevance | Feasibility | Priority | Notes |
|---|---|---|---|---|---|---|
| 1.8.1 | Resource interface (classpath, file, URL) | none | medium | high | P3 | JS has `import()`, `fetch()`, `fs` — but no unified resource abstraction |
| 1.8.2 | ResourceLoader | none | medium | high | P3 | Could unify file/URL/module loading |
| 1.8.3 | ResourcePatternResolver | none | low | medium | defer | Ant-style classpath scanning — no JS equivalent |

---

## Part 2: Spring Boot Core

### 2.1 Auto-Configuration

| # | Spring Boot Feature | @alt-js Coverage | Relevance | Feasibility | Priority | Notes |
|---|---|---|---|---|---|---|
| 2.1.1 | Auto-configuration mechanism | none | high | high | P1 | **Major gap.** Spring Boot auto-discovers and registers beans based on classpath and conditions. @alt-js has no equivalent. |
| 2.1.2 | `@EnableAutoConfiguration` | none | high | high | P1 | Entry point for auto-configuration |
| 2.1.3 | `spring.factories` / `AutoConfiguration.imports` | none | high | medium | P1 | Service loader pattern — JS could use package.json exports or a manifest file |
| 2.1.4 | Auto-configuration ordering | none | medium | high | P2 | `@AutoConfigureBefore/After` — ordering of auto-config classes |

### 2.2 Conditional Bean Registration

| # | Spring Boot Feature | @alt-js Coverage | Relevance | Feasibility | Priority | Notes |
|---|---|---|---|---|---|---|
| 2.2.1 | `@ConditionalOnProperty` | none | high | high | P1 | Register bean only if config property matches — critical for smart defaults |
| 2.2.2 | `@ConditionalOnClass` | none | high | medium | P1 | Register bean only if a class/module is available |
| 2.2.3 | `@ConditionalOnMissingBean` | none | high | high | P1 | Register bean only if not already defined — enables overridable defaults |
| 2.2.4 | `@ConditionalOnBean` | none | medium | high | P2 | Register bean only if another bean exists |
| 2.2.5 | `@ConditionalOnExpression` | none | low | medium | defer | SpEL-based conditions — defer with SpEL |
| 2.2.6 | Custom Condition implementations | none | high | high | P1 | User-defined condition functions |

### 2.3 Externalized Configuration

| # | Spring Boot Feature | @alt-js Coverage | Relevance | Feasibility | Priority | Notes |
|---|---|---|---|---|---|---|
| 2.3.1 | `application.properties` / `application.yml` | partial | high | high | — | node-config handles config files, but not with Spring Boot's specific conventions |
| 2.3.2 | Profile-specific config files | partial | high | high | P2 | node-config supports `NODE_ENV`-based files (e.g. `local.json`), but no programmatic profile config |
| 2.3.3 | Config property binding (`@ConfigurationProperties`) | none | high | high | P1 | No typed, validated config binding to objects |
| 2.3.4 | Relaxed binding (kebab-case, camelCase, SCREAMING_SNAKE) | none | medium | high | P3 | node-config is case-sensitive |
| 2.3.5 | Config property override order | partial | high | high | P2 | node-config has its own order; no unified override chain with env vars, CLI args |

### 2.4 Starter Conventions

| # | Spring Boot Feature | @alt-js Coverage | Relevance | Feasibility | Priority | Notes |
|---|---|---|---|---|---|---|
| 2.4.1 | Starter POMs / packages | none | medium | high | P2 | Convention for bundling auto-config + dependencies. Could use npm package conventions. |
| 2.4.2 | `spring-boot-starter-*` naming | none | low | high | P3 | Naming convention only |
| 2.4.3 | Opinionated defaults | partial | high | high | P2 | Boot.boot() provides opinionated defaults for config/logging, but limited scope |

### 2.5 Actuator / Observability

| # | Spring Boot Feature | @alt-js Coverage | Relevance | Feasibility | Priority | Notes |
|---|---|---|---|---|---|---|
| 2.5.1 | Health endpoint | none | medium | high | P3 | Health check for components — useful but not core |
| 2.5.2 | Info endpoint | none | low | high | defer | Application info — low priority |
| 2.5.3 | Metrics | none | medium | medium | defer | Prometheus/metrics — domain-specific |
| 2.5.4 | Environment endpoint | none | medium | high | P3 | Expose effective config — useful for debugging |

### 2.6 Application Lifecycle

| # | Spring Boot Feature | @alt-js Coverage | Relevance | Feasibility | Priority | Notes |
|---|---|---|---|---|---|---|
| 2.6.1 | `SpringApplication.run()` | full | high | high | — | `Application.run()` exists |
| 2.6.2 | ApplicationRunner / CommandLineRunner | none | high | high | P1 | No hook for "run after context is ready" beyond the run() convention |
| 2.6.3 | Application startup events (ApplicationStartingEvent, etc.) | none | high | high | P1 | Ties to event system (1.4.x) |
| 2.6.4 | Failure analyzers | none | medium | high | P2 | Better error messages on startup failure — low-hanging fruit |
| 2.6.5 | Banner / startup info | none | low | high | defer | Cosmetic |
| 2.6.6 | Graceful shutdown | none | medium | high | P2 | Current destroy uses process signals but no graceful drain |

---

## Part 3: Cross-Cutting Observations

### 3.1 Code Duplication

The `getGlobalRef()` / `detectBrowser()` / `getGlobalRoot()` pattern appears in **4 files across 4 packages**. This is the most concrete monorepo driver — extracting this to a shared module would eliminate ~80 lines of duplication and ensure fixes propagate.

`isPlainObject()` is duplicated between `DelegatingConfig.js` and `JSONFormatter.js`.

### 3.2 Global State as Integration Mechanism

All cross-package integration flows through `global.boot.contexts.root`. This is functional but has issues:
- No encapsulation — any code can read/write the global
- No lifecycle — the global is set once and never cleaned up (tests manually reset it)
- Boot must happen before any other package can resolve its dependencies

Spring solves this with the ApplicationContext itself as the integration point, not a global. The @alt-js approach of using globals was pragmatic for avoiding import cycles, but a shared kernel (from monorepo) could provide a cleaner integration mechanism.

### 3.3 Missing Constructor Injection

This is arguably the biggest DI gap. Spring strongly recommends constructor injection as the default — it makes dependencies explicit, enables immutability, and makes testing trivial. @alt-javascript only supports property injection post-construction, which means:
- Dependencies aren't visible in the constructor signature
- No way to make injected properties `readonly`
- Null-matching autowire can silently inject unexpected dependencies

### 3.4 Prototype Method Reassignment Pattern

Multiple classes reassign prototype methods in their constructors. This is a code smell that suggests the inheritance hierarchy isn't clean — if subclasses need to explicitly copy parent methods, the delegation chain has a design issue.

---

## Part 4: Synthesis — Top Priority Improvements

### P1 — Must-Have for v3.0

| # | Improvement | Covers Spring Features | Estimated Effort | Key Challenge |
|---|---|---|---|---|
| 1 | **BeanPostProcessor** | 1.3.4, 1.7.8 | Medium | Design the hook API — pre/post processing on every bean creation |
| 2 | **Application Event System** | 1.4.1–1.4.4, 2.6.3 | Medium | Isomorphic (no Node EventEmitter dependency for browser) |
| 3 | **Component Auto-Discovery** | 2.1.1–2.1.3 | Medium-High | Pure JS, no decorators — static class properties or manifest approach |
| 4 | **Conditional Bean Registration** | 2.2.1–2.2.3, 2.2.6 | Medium | Condition functions evaluated during context preparation |
| 5 | **Constructor Injection** | 1.1.3 | Medium | Define constructor arg specification format |
| 6 | **Aware Interfaces** | 1.3.9 | Low | Convention-based: if bean has `setApplicationContext`, call it |
| 7 | **AOP via Proxy** | 1.7.1–1.7.4, 1.7.6 | Medium | Wrap singletons in Proxy during BeanPostProcessor phase |

### P2 — High-Value for v3.0

| # | Improvement | Covers Spring Features | Estimated Effort |
|---|---|---|---|
| 8 | Environment abstraction | 1.5.1, 1.5.2, 1.5.4 | Medium |
| 9 | Circular dependency detection | 1.1.12 | Low |
| 10 | Explicit initialization ordering (`@DependsOn`) | 1.1.13 | Low |
| 11 | `@Primary` equivalent | 1.1.9 | Low |
| 12 | Collection injection | 1.1.10 | Low |
| 13 | Failure analyzers (better startup errors) | 2.6.4 | Low |
| 14 | Lifecycle interface (start/stop) | 1.3.7 | Low |
| 15 | Graceful shutdown | 2.6.6 | Medium |
| 16 | Qualified injection | 1.1.8 | Low |
| 17 | ApplicationRunner / CommandLineRunner | 2.6.2 | Low |
| 18 | Config property binding | 2.3.3 | Medium |
| 19 | AOP pointcut expressions | 1.7.5 | Medium |
| 20 | BeanFactoryPostProcessor | 1.3.5 | Medium |

### P3 / Defer

SpEL, custom scopes, web scopes, resource abstraction, relaxed config binding, actuator endpoints, banner, YAML config, generic event typing, AOP introductions.

### Monorepo Implications

The gap analysis strongly supports monorepo migration:
1. **Shared global-ref code** — extract to a shared kernel package
2. **Cross-package refactoring** — BeanPostProcessor, events, and aware interfaces need changes across cdi + boot
3. **Constructor injection** — needs coordinated changes in cdi Component definition + Boot's context setup
4. **Consistent versioning** — implementing P1 improvements requires synchronized releases across all four packages
5. **isPlainObject and other utilities** — shared utility code should live in one place

---

## Summary Table

| Area | Features Analyzed | Full Coverage | Partial | None | Top Priority |
|---|---|---|---|---|---|
| IoC / DI | 13 | 2 | 4 | 7 | Constructor injection, Autowired cleanup |
| Bean Scopes | 5 | 2 | 0 | 3 | Custom scopes (P3) |
| Bean Lifecycle | 9 | 0 | 3 | 6 | BeanPostProcessor, Aware interfaces |
| Events | 7 | 0 | 0 | 7 | Full event system |
| Environment/Profiles | 9 | 1 | 3 | 5 | Environment abstraction |
| SpEL | 3 | 0 | 0 | 3 | Defer |
| AOP | 8 | 0 | 0 | 8 | Proxy-based interception |
| Resources | 3 | 0 | 0 | 3 | Defer |
| Auto-Configuration | 4 | 0 | 0 | 4 | Auto-discovery mechanism |
| Conditional Beans | 6 | 0 | 0 | 6 | ConditionalOnProperty/Class/MissingBean |
| Externalized Config | 5 | 0 | 2 | 3 | Config property binding |
| Starters | 3 | 0 | 1 | 2 | Defer |
| Actuator | 4 | 0 | 0 | 4 | Defer |
| App Lifecycle | 6 | 1 | 1 | 4 | ApplicationRunner, startup events |
| **Totals** | **85** | **6** | **14** | **65** | |
