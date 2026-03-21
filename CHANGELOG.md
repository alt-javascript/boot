# Changelog

## 3.0.2 — 2026-03-21

### Bug fixes

- **`@alt-javascript/common` publishConfig missing.** The package was missing
  `"publishConfig": { "access": "public" }`, causing npm to reject the publish with a 402
  Payment Required error. Added to match all other scoped packages in the monorepo.

- **`Context`, `Singleton`, `Prototype`, `Service`, `Transient`, `Property`, `Scopes`
  re-exported from `@alt-javascript/cdi` main entry.** These helpers were only accessible via
  the deep import `@alt-javascript/cdi/context/index.js`, which doesn't resolve from a CDN URL.
  They are now exported from `cdi/index.js` and included in the ESM bundle, so CDN users can
  write `new Context([new Singleton(MyService)])` directly.

- **`ProfileAwareConfig` and `BrowserProfileResolver` added to the config browser bundle.**
  Both classes were omitted from `config/browser/index.js` despite being entirely browser-safe.
  The config ESM bundle now includes them, enabling the v3 profile pattern from CDN.

- **Logger browser bundle excludes Node.js-only classes.** The logger rollup previously used
  `index.js` as its entry point, pulling `WinstonLogger`, `WinstonLoggerFactory`,
  `CachingLoggerFactory`, `CachingConsole`, and `MultiLogger` into the browser bundle.
  A new `browser/index.js` entry exports only the browser-safe subset.

### New

- **`@alt-javascript/boot-vue` ESM dist bundle.** `boot-vue` now builds and publishes
  `dist/alt-javascript-boot-vue-esm.js`. CDN usage of `createCdiApp` and `cdiPlugin` works
  without a bundler.

## 3.0.1 — 2026-03-21

### Bug fixes

- **Browser ESM dist bundles now published.** All five browser-facing packages (`common`, `config`,
  `logger`, `cdi`, `boot`) now build and publish pre-built ESM bundles to `dist/`. The 3.0.0
  release shipped without running the rollup build, so `dist/` was absent from every published
  package and CDN/no-build usage was broken. See [Browser Usage](docs/browser.md).

- **`@alt-javascript/common` now published.** This package existed in the monorepo at 3.0.0 but
  was never actually published to npm. All dependent packages now resolve correctly.

- **`Application-browser.js` fixed.** The dynamic `import('@alt-javascript/cdi/ApplicationContext')`
  in the browser entry point was not destructuring the module default, causing `new ApplicationContext()`
  to fail when calling `Application.run()` without a pre-built context. Replaced with a static import.

- **CI build step added.** The npm publish workflow now runs `npm run build` before
  `npm publish --workspaces`, so dist bundles are always present at publish time.

### Documentation

- **[Browser Usage](docs/browser.md)** rewritten. Covers CDN usage with pre-built ESM bundles
  (the recommended no-build path), the CDN bundle URL table, import map requirements, browser
  compatibility, local-install-with-import-map as an alternative, and a browser limitations
  reference table.

## 3.0.0 — 2026-03-18

Complete rewrite as a monorepo with 17 packages. Breaking changes from v2.x.

### New packages

- `@alt-javascript/common` — shared kernel (global ref, environment detection)
- `@alt-javascript/jsdbc-template` — JsdbcTemplate, NamedParameterJsdbcTemplate, auto-configuration
- `@alt-javascript/boot-express` — Express adapter with ControllerRegistrar
- `@alt-javascript/boot-fastify` — Fastify adapter
- `@alt-javascript/boot-koa` — Koa adapter
- `@alt-javascript/boot-hono` — Hono adapter (Web Standards API)
- `@alt-javascript/boot-lambda` — AWS Lambda adapter (API Gateway HTTP API v2)
- `@alt-javascript/boot-cloudflare-worker` — Cloudflare Workers adapter
- `@alt-javascript/boot-azure-function` — Azure Functions adapter
- `@alt-javascript/boot-vue` — Vue 3 CDI integration
- `@alt-javascript/boot-alpine` — Alpine.js CDI integration
- `@alt-javascript/boot-react` — React CDI integration (Context/hooks)
- `@alt-javascript/boot-angular` — Angular CDI integration (providers)

### Core enhancements

- **Auto-discovery**: static `__component` class property for self-registering components
- **AOP**: before/after/around/afterReturning/afterThrowing advice via JS Proxy
- **Application events**: typed event bus with `ContextRefreshedEvent`, `ContextClosedEvent`
- **BeanPostProcessor**: intercept bean creation for cross-cutting concerns
- **Conditional registration**: `conditionalOnProperty`, `conditionalOnClass`, `conditionalOnMissingBean`, `conditionalOnProfile`
- **Constructor injection**: `__inject` static property specifies constructor dependencies
- **Circular dependency detection**: fails fast with clear error message and dependency chain
- **`dependsOn`**: explicit ordering of bean initialization
- **Primary beans**: `primary: true` resolves ambiguous autowiring
- **Profile-aware config**: Spring Boot-aligned file loading with `NODE_ACTIVE_PROFILES`
- **Property source chain**: layered precedence (overrides → env → profile files → defaults → fallback)
- **YAML and .properties support**: `application.yaml`, `application.properties` alongside JSON
- **Startup banner**: configurable banner printed during ApplicationContext startup
- **Browser profiles**: `BrowserProfileResolver` — declarative URL-to-profile mapping for browser apps
- **`ProfileAwareConfig`**: profile-specific config overlays for browser environments

### Breaking changes

- Monorepo structure — install individual `@alt-javascript/*` packages
- `@alt-javascript/common` extracts shared utilities previously duplicated across packages
- `Boot.boot()` global context shape updated
- Config `WindowLocationSelectiveConfig` replaced by `BrowserProfileResolver` + `ProfileAwareConfig`
