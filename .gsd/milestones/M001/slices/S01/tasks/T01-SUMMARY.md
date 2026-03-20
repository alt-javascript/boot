---
id: T01
parent: S01
milestone: M001
provides:
  - Complete capability inventory of all four @alt-javascript packages
  - Cross-package integration point map
  - Code health observations
requires:
  - slice: none
    provides: first task
affects: [S01/T02, S01/T03]
key_files:
  - Boot.js
  - Application.js
  - ../cdi/ApplicationContext.js
  - ../cdi/context/Component.js
  - ../config/ValueResolvingConfig.js
  - ../config/ConfigFactory.js
  - ../logger/LoggerFactory.js
  - ../logger/ConfigurableLogger.js
key_decisions: []
patterns_established: []
drill_down_paths:
  - .gsd/milestones/M001/slices/S01/tasks/T01-PLAN.md
duration: 45min
verification_result: pass
completed_at: 2026-03-18T00:30:00Z
---

# T01: Deep audit of existing @alt-javascript capabilities

**Complete capability inventory of four @alt-javascript packages with cross-package integration mapping and code health observations**

## What Happened

Systematically read every source file across boot (6 files), cdi (9 source + 7 test), config (13 source), and logger (14 source). Produced the inventory below.

## Capability Inventory

### Package: @alt-javascript/boot

| Capability | File | Notes |
|---|---|---|
| Environment detection (Node/browser) | `Boot.js` `detectBrowser()` | Checks `typeof window === 'undefined'` |
| Global reference resolution | `Boot.js` `getGlobalRef()`, `getGlobalRoot()` | **Duplicated in 4 packages** |
| Config auto-detection | `Boot.js` `detectConfig()` | Finds config from: argument → global `config` → `window.config` |
| Global root context setup | `Boot.js` `boot()` | Writes `global.boot.contexts.root = {config, loggerFactory, loggerCategoryCache, fetch}` |
| Test bootstrap (quiet logging) | `Boot.js` `test()` | Uses CachingLoggerFactory to suppress output |
| Root context accessor | `Boot.js` `root(name, default)` | Reads from `global.boot.contexts.root[name]` |
| Application bootstrap | `Application.js` `run()` | Calls Boot.boot() then lazy-imports CDI ApplicationContext, runs lifecycle |
| Browser variants | `Boot-browser.js`, `Application-browser.js` | Same logic, targeting `window` |
| Browser bundles | `dist/` via rollup | IIFE and ESM bundles |
| Re-exports | `index.js` | Exports Boot, Application, boot, root, test, config |

### Package: @alt-javascript/cdi

| Capability | File | Notes |
|---|---|---|
| **IoC Container** | `ApplicationContext.js` | Full lifecycle container |
| Bean scopes: singleton | `Scopes.js` `SINGLETON`, `SERVICE` | Both map to `'singleton'` |
| Bean scopes: prototype | `Scopes.js` `PROTOTYPE`, `TRANSIENT` | Both map to `'prototype'` |
| Component registration (programmatic) | `Component.js` | Manual `new Component(MyClass)` |
| Convenience wrappers | `Singleton.js`, `Service.js`, `Prototype.js`, `Transient.js` | Preset scope on Component |
| Context wrapper | `Context.js` | Wraps array of components |
| Property definition | `Property.js` | name, reference, value, defaultValue |
| Config-driven context | `ApplicationContext.detectConfigContext()` | Reads components from `config.get('context')` |
| Global context components | `ApplicationContext.detectGlobalContextComponents()` | Auto-registers config, loggerFactory, loggerCategoryCache, logger(prototype), fetch |
| **Autowiring: implicit** | `autowireComponentDependencies()` | Null properties auto-matched to context by name |
| **Autowiring: explicit** | `autowireComponentDependencies()` | Properties set to `'autowired'` or `Autowired` function |
| **Config placeholder injection** | `autowireComponentDependencies()` | `${path:default}` strings resolved from config |
| Property wiring (explicit) | `wireComponentDependencies()` | Properties array with reference, value, path, defaultValue |
| Singleton lifecycle: create | `createSingletons()` | `new Reference()` or factory invocation |
| Singleton lifecycle: inject | `injectSingletonDependencies()` | Autowire + wire after creation |
| Singleton lifecycle: init | `initialiseSingletons()` | Calls `instance.init()` or named init method |
| Singleton lifecycle: run | `run()` | Calls `instance.run()` or named run method |
| Singleton lifecycle: destroy | `registerSingletonDestroyers()` | Registers on SIGINT, SIGUSR1/2, uncaughtException |
| Profiles | `parseContextComponent()` | Comma-separated profiles, negation with `!`, inactive skipping |
| Duplicate detection | `parseContextComponent()` | Throws on duplicate component name |
| Dynamic import | `parseContextComponent()` | `component.require` → `await import()` |
| Prototype: class instantiation | `get()` | `new Reference()` for classes |
| Prototype: function factory | `get()` | `Reference(...args)` for functions |
| Prototype: factory method | `get()` | `factory.factoryFunction(...args)` |
| Prototype: wireFactory | `get()` | `wireFactory.factoryFunction(...args)` — used for logger prototype |
| Prototype: deep clone | `get()` | `_.cloneDeep()` for non-class, non-function |
| **No component scanning** | — | Must register components manually or via config |
| **No BeanPostProcessor** | — | No pre/post-processing hooks |
| **No events** | — | No event publishing/subscribing |
| **No AOP** | — | No method interception |
| **No conditional registration** | — | Only profiles (coarse-grained) |
| **No aware interfaces** | — | No ApplicationContextAware, etc. |
| **No ordered initialization** | — | Components init in insertion order, no `@Order` equivalent |

### Package: @alt-javascript/config

| Capability | File | Notes |
|---|---|---|
| Config wrapping (node-config) | `ConfigFactory.js` | Wraps `npmconfig` (node-config) as default |
| Ephemeral config | `EphemeralConfig.js` | In-memory config from plain object, dot-path navigation |
| Delegating config | `DelegatingConfig.js` | Base class, Object.assign merging, plain-object detection |
| Value-resolving config | `ValueResolvingConfig.js` | Wraps config with resolver chain, `get()` returns resolved values |
| Async config fetch | `ValueResolvingConfig.fetch()` | Async value resolution (URL fetching) |
| **Placeholder resolution** | `PlaceHolderResolver.js` | `${key}` syntax, recursive resolution |
| **Jasypt decryption** | `JasyptDecryptor.js` | `enc.` prefix or `ENC()` parenthesis → decrypt |
| **URL resolution** | `URLResolver.js` | `url.`/`URL`/`FETCH` prefix → HTTP fetch |
| Selector hierarchy | `Selector.js`, `PlaceHolderSelector.js`, `PrefixSelector.js`, `ParenthesisSelector.js` | Pattern matching for resolver routing |
| Resolver hierarchy | `Resolver.js`, `SelectiveResolver.js`, `DelegatingResolver.js` | Chain of responsibility for value resolution |
| Browser location config | `WindowLocationSelectiveConfig.js` | URL-based config key override (e.g. per-page config) |
| Global reference resolution | `ConfigFactory.js` `getGlobalRef()`, `detectBrowser()`, `getGlobalRoot()` | **Duplicated** |
| Fetch detection | `ConfigFactory.detectFetch()` | Finds fetch from global/argument |
| **No property sources** | — | No equivalent to Spring's `@PropertySource` loading |
| **No YAML support** | — | Only JSON-like config objects (node-config handles file format) |
| **No Environment abstraction** | — | No unified environment with profiles, property sources, system properties |
| **No config validation** | — | No `@ConfigurationProperties` validation |
| **No type coercion** | — | `get()` returns whatever is in config, no typed getters |

### Package: @alt-javascript/logger

| Capability | File | Notes |
|---|---|---|
| Logger base class | `Logger.js` | Category, level, level checking |
| Level hierarchy | `LoggerLevel.js` | fatal(0) → error(1) → warn(2) → info(3) → verbose(4) → debug(5) |
| Console logger | `ConsoleLogger.js` | Format + console output, injectable formatter |
| Winston integration | `WinstonLogger.js`, `WinstonLoggerFactory.js` | Wraps winston with same API |
| Multi-logger | `MultiLogger.js` | Fan-out to multiple loggers |
| Delegating logger | `DelegatingLogger.js` | Decorator pattern wrapping a provider |
| Configurable logger | `ConfigurableLogger.js` | Category-based level from config hierarchy |
| Logger factory (static) | `LoggerFactory.js` | Static `getLogger()` with global context detection |
| Logger factory (instance) | `LoggerFactory` constructor | Instance with config, cache, configPath |
| Caching logger factory | `CachingLoggerFactory.js` | Uses `CachingConsole` for test quiet mode |
| Caching console | `CachingConsole.js` | In-memory log capture, configurable size, quiet mode |
| Category cache | `LoggerCategoryCache.js` | Simple key-value cache for resolved log levels |
| JSON formatter | `JSONFormatter.js` | `{level, message, timestamp, category, ...meta}` |
| Plain text formatter | `PlainTextFormatter.js` | `timestamp:category:level:message` |
| Global reference resolution | `LoggerFactory.js` `getGlobalRef()`, `detectBrowser()`, `getGlobalRoot()` | **Duplicated** |

## Cross-Package Integration Points

1. **Global boot context** (`global.boot.contexts.root`): Written by Boot, read by LoggerFactory, ConfigFactory, ApplicationContext
2. **Config detection chain**: Boot.detectConfig() → ConfigFactory.getConfig() → ValueResolvingConfig
3. **LoggerFactory global detection**: LoggerFactory.detectLoggerFactory() reads from boot context
4. **CDI auto-registers globals**: ApplicationContext.detectGlobalContextComponents() registers config, loggerFactory, loggerCategoryCache, fetch from boot context
5. **Logger as prototype**: CDI wires logger as prototype via wireFactory → loggerFactory.getLogger()
6. **Application → CDI**: Application.run() dynamically imports ApplicationContext and calls lifeCycle()

## Code Health Observations

### Critical: Duplicated Global Resolution Code
`getGlobalRef()`, `detectBrowser()`, and `getGlobalRoot()` are implemented **identically** in:
- `Boot.js` (boot)
- `ApplicationContext.js` (cdi)
- `ConfigFactory.js` (config)
- `LoggerFactory.js` (logger)

This is 4 copies of ~20 lines each, with identical logic. Any fix must be applied in 4 places.

### Moderate: Prototype Method Reassignment
In ConsoleLogger, WinstonLogger, MultiLogger, and ConfigurableLogger, prototype methods are reassigned in the constructor:
```js
ConsoleLogger.prototype.setLevel = Logger.prototype.setLevel;
```
This is unusual and fragile — it reassigns shared prototype properties from within instance construction.

### Moderate: Implicit Autowiring Fragility
Null properties on singletons are auto-matched to context components by name. This means adding a null property whose name happens to match a context component will silently inject it — surprising behavior.

### Minor: Mixed CJS/ESM in test fixtures
`test/service/context.js` in CDI uses `require()` / `module.exports` but the project is `"type": "module"`.

### Minor: lodash Dependency
CDI depends on lodash for `_.lowerFirst`, `_.intersection`, `_.filter`, `_.map`, `_.cloneDeep`. These could be replaced with native JS.

### Minor: DelegatingConfig.isPlainObject / JSONFormatter.isPlainObject
Same utility function duplicated between config and logger packages.

## Deviations

None — the audit was straightforward.
