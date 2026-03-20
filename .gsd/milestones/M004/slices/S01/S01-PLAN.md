# S01: Code-Level Documentation (JSDoc)

**Goal:** Every public class, method, and export has JSDoc documentation.
**Demo:** Any developer can hover over an import and see types, params, descriptions.

## Must-Haves

- All public classes have `@class` + description
- All public methods have `@param`, `@returns`, description
- All constructors document their parameters
- Static methods documented
- Module-level `index.js` exports have brief descriptions
- 351 existing tests still pass (docs only, no behavior changes)

## Tasks

- [ ] **T01: cdi package JSDoc** `est:1h`
  - ApplicationContext.js (775 lines, ~50 methods), Aop.js, AutoDiscovery.js, BeanPostProcessor.js, Conditions.js
  - context/*.js, events/*.js

- [ ] **T02: config package JSDoc** `est:45m`
  - PropertiesParser.js, PropertySourceChain.js, EnvPropertySource.js, ProfileConfigLoader.js
  - EphemeralConfig.js, ValueResolvingConfig.js, DelegatingConfig.js, ConfigFactory.js
  - Resolver chain: DelegatingResolver, PlaceHolderResolver, SelectiveResolver, URLResolver, Selector subclasses

- [ ] **T03: boot + logger + common JSDoc** `est:45m`
  - boot: Boot.js, Application.js, browser variants
  - logger: LoggerFactory.js, ConfigurableLogger.js, ConsoleLogger.js, DelegatingLogger.js, MultiLogger.js, CachingLoggerFactory.js, WinstonLogger.js, formatters, LoggerLevel, LoggerCategoryCache
  - common: index.js (getGlobalRef, detectBrowser, getGlobalRoot, isPlainObject)

## Verification

- `cd /Users/craig/src/github/alt-javascript/altjs && npm test` — 351 tests pass
- Spot-check: `grep -c '/\*\*' packages/*//*.js` shows substantial increase
