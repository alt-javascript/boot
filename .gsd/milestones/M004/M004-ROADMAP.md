# M004 Roadmap: Documentation

## Boundary Map

| Package | Source files | Current JSDoc | Needs |
|---|---|---|---|
| common | 1 | 5 | Module + function docs |
| boot | 6 | 0 | Full JSDoc pass |
| cdi | 20 | 42 | Complete — ApplicationContext.js (775 lines) is the big one |
| config | 18 | 18 | New modules have some, legacy modules need pass |
| logger | 14 | 5 | Full JSDoc pass |

## Slices

- [ ] **S01: Code-Level Documentation (JSDoc)** `risk:low` `depends:[]`
  - Add JSDoc to all public classes, methods, and module exports
  - Focus on: class purpose, method params/returns, constructor args
  - Priority order: cdi (most complex), config (new modules), boot, logger, common

- [ ] **S02: Repository Documentation** `risk:medium` `depends:[S01]`
  - README.md — project overview, quick start, installation
  - docs/getting-started.md — tutorial for first-time users
  - docs/dependency-injection.md — DI reference (context definitions, autowiring, scopes, constructor injection)
  - docs/configuration.md — config reference (PropertySourceChain, profiles, .properties format, env binding)
  - docs/lifecycle.md — component lifecycle (init/start/run/stop/destroy, events, BeanPostProcessor)
  - docs/advanced.md — AOP, auto-discovery, conditions, primary beans, dependsOn
  - docs/spring-comparison.md — similarities, differences, migration guide for Spring developers
  - docs/browser.md — browser ESM usage, import maps, CDN
  - docs/api-reference.md — condensed API reference (all exports, all packages)
  - decisions/ — MADR-format ADRs derived from D001–D010 plus new ones for idiosyncratic choices
