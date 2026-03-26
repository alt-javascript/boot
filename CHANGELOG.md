# Changelog

## 3.0.7 — 2026-03-26

### New feature

- **Cross-cutting middleware pipeline across all 7 HTTP and serverless adapters.**
  A framework-agnostic `MiddlewarePipeline` (Koa-style onion compose) is now the
  dispatch layer for every adapter — Express, Fastify, Koa, Hono, Lambda, Cloudflare
  Workers, and Azure Functions. Any CDI component that declares
  `static __middleware = { order: N }` participates automatically; lower order = outermost.
  Three built-in middleware components are registered by every `*Starter()`:
  `RequestLoggerMiddleware` (order 10, logs `[METHOD] /path → status (Xms)`),
  `ErrorHandlerMiddleware` (order 20, converts throws to structured JSON error responses),
  and `NotFoundMiddleware` (order 30, returns 404 when no route matches). All three are
  disableable via config flags (`middleware.requestLogger.enabled`, etc.) and individually
  replaceable via CDI's `conditionalOnMissingBean` pattern. `MiddlewarePipeline`,
  `RequestLoggerMiddleware`, `ErrorHandlerMiddleware`, and `NotFoundMiddleware` are exported
  from `@alt-javascript/boot`. All duplicate `try/catch` and inline 404 blocks have been
  removed from adapter internals — they are now handled uniformly by the pipeline.
  The normalised request shape `{ method, path, params, query, headers, body, ctx }` is
  consistent across all seven adapters so middleware written once works everywhere.

- **Node.js minimum version raised to 20.**
  Dependencies including `config@4.4.1`, `chokidar@5`, `listr2@9`, and `cliui@9`
  require Node.js ≥ 20. The `engines` field in all packages has been updated to
  `"node": ">=20"` and the CI matrix now tests 20.x, 22.x, and 24.x only.

### Documentation

- **All publishable package READMEs updated.** Every adapter README now documents the
  middleware pipeline with a built-in component table, a custom `AuthMiddleware` example,
  and the config flags for disabling built-ins. Core package READMEs (`@alt-javascript/cdi`,
  `@alt-javascript/config`, `@alt-javascript/logger`) updated with Spring Framework / SLF4J
  attribution tables. Root monorepo README updated with a comprehensive Spring concept
  mapping table and the full middleware pipeline quick-start.

- **Spring Framework attributed as design collaborator.** The `contributors` field in all
  publishable package.json files now credits Spring Framework (VMware/Broadcom) as the
  design inspiration and pattern source. A full concept-to-concept mapping table is
  included in the root README and each relevant package README.

### Examples

- **`example-2-1-servers-express` and `example-3-1-serverless-lambda` updated** to
  demonstrate the middleware pipeline end-to-end: a custom `AuthMiddleware` CDI component
  protects routes, `RequestLoggerMiddleware` logs every request, and
  `ErrorHandlerMiddleware` converts handler throws to structured error responses.
  The Lambda example test suite extended with explicit 401 (no token) and 200
  (valid token) assertions.

## 3.0.6 — 2026-03-26

### New feature

- **`.env` file support in `@alt-javascript/config`.**
  `ProfileConfigLoader` now discovers and loads `application.env` and
  `application-{profile}.env` alongside existing JSON/YAML/properties files.
  Files are parsed by the new `DotEnvParser` (bare, `export`-prefixed, double/single-quoted
  values, inline `#` comments, escape sequences) and wrapped in `EnvPropertySource` so relaxed
  binding (`DB_HOST` → `db.host`, `SPRING__DATASOURCE__URL` → `spring.datasource.url`) applies
  identically to `process.env` vars. Real environment variables always take precedence over
  `.env` file values — `.env` slots between `process.env` (layer 2) and profile config files
  (layer 4) in the 6-layer property source chain. `DotEnvParser` is exported from the package
  index for direct use.

### Documentation

- **`@alt-javascript/config` README updated.** Property source precedence table expanded from
  5 to 6 layers to include `.env` files. New `## .env Files` section documents the discovery
  naming convention, supported format features, relaxed binding table, and the browser
  limitation (Node.js only — use `EphemeralConfig` for browser targets).

## 3.0.5 — 2026-03-25

### Bug fix

- **`@alt-javascript/logger` browser dist: bare specifier for `@alt-javascript/config`.**
  `LoggerFactory.js` imports `{ config }` from `@alt-javascript/config`. The rollup config
  rewrote `@alt-javascript/common` to its CDN URL but left `@alt-javascript/config` as a bare
  specifier in the bundle. Any CDN import of the logger ESM bundle failed with a module
  resolution error in browser contexts. Fixed by adding `@alt-javascript/config` to the
  `esmImportToUrl` imports map in `rollup.config.js`, rewriting it to its CDN URL
  (`https://cdn.jsdelivr.net/npm/@alt-javascript/config@3/dist/alt-javascript-config-esm.js`).
  Dist rebuilt and committed.

## 3.0.4 — 2026-03-22

### New packages

- **`@alt-javascript/boot-jsdbc`** — CDI auto-configuration for SQL persistence via
  `@alt-javascript/jsdbc`. Registers `dataSource`, `jsdbcTemplate`,
  `namedParameterJsdbcTemplate`, and `schemaInitializer` beans from `boot.datasource.*` config.
  Provides `jsdbcTemplateStarter()`, `jsdbcStarter()`, `jsdbcAutoConfiguration()`,
  `DataSourceBuilder` (secondary datasources), `ConfiguredDataSource`, and `SchemaInitializer`.

- **`@alt-javascript/flyway`** — Standalone Flyway-inspired migration engine (no Boot/CDI
  dependency). Implements the Flyway OSS feature set (Apache 2.0 attribution): versioned
  migrations (`V{version}__{description}.sql`), CRC32 checksum verification, schema history
  tracking (`flyway_schema_history`), `migrate()`, `info()`, `validate()`, `baseline()`,
  `repair()`, and `clean()`.

- **`@alt-javascript/boot-flyway`** — CDI starter for `@alt-javascript/flyway`. Registers a
  `managedFlyway` bean that runs `migrate()` during context startup. Reads configuration from
  `boot.flyway.*`. Exposes `ready()` for dependants to await completion (CDI does not await
  async `init()`). Supports custom history table name, baseline-on-migrate, out-of-order
  migrations, and secondary datasource wiring via `datasourceBean` option.

- **`@alt-javascript/boot-jsnosqlc`** — CDI auto-configuration for NoSQL persistence via
  `@alt-javascript/jsnosqlc`. Registers `nosqlClientDataSource` and `nosqlClient` beans from
  `boot.nosql.*` config. No template layer — `Collection` is the high-level API. Provides
  `jsnosqlcStarter()`, `jsnosqlcAutoConfiguration()`, `jsnosqlcBoot()`, `NoSqlClientBuilder`
  (secondary clients), `ConfiguredClientDataSource`, and `ManagedNosqlClient`.

### New examples

- **`example-5-1-advanced`** — AOP, application events, `BeanPostProcessor`, constructor
  injection, conditional beans, `setApplicationContext`, and dev-profile configuration.

- **`example-5-2-persistence-jsdbc`** — SQL persistence with `jsdbcTemplateStarter()`;
  `NoteRepository` backed by `JsdbcTemplate`; schema and seed data loaded from
  `config/schema.sql` and `config/data.sql` by `SchemaInitializer`.

- **`example-5-3-persistence-flyway`** — Flyway-managed schema evolution: three migration
  files (`V1` table, `V2` schema change, `V3` seed data); `NoteRepository` carries no DDL;
  `Application.run()` awaits `managedFlyway.ready()`.

- **`example-5-4-persistence-flyway-multidb`** — Two independent SQL databases in one
  `ApplicationContext`: primary notes DB with its own `JsdbcTemplate` and Flyway runner,
  secondary tags DB with its own stack and independent `managedFlywayTags` runner.
  Application awaits `Promise.all([mf.ready(), mft.ready()])`.

- **`example-5-5-persistence-nosql`** — NoSQL persistence with `jsnosqlcBoot()`; `NoteRepository`
  uses `Collection` directly (`insert`, `get`, `update`, `delete`, `find`, `for await...of`);
  `Filter.where().contains()` for tag-based queries.

- **`example-5-6-persistence-nosql-multidb`** — Two independent NoSQL clients in one context:
  `nosqlClient` (user profiles) and `sessionClient` (session tokens). Store isolation verified.

### New: `@alt-javascript/jsdbc-template` (CDI-free)

- **`JsdbcTemplate` and `NamedParameterJsdbcTemplate` extracted from CDI dependency.**
  CDI auto-configuration moved to `boot-jsdbc`, leaving `jsdbc-template` dependency-free.
  `JsdbcTemplate` can now be used standalone without a CDI context.

### Bug fixes

- **`ConfiguredDataSource.getConnection()` concurrent-init race (boot-jsdbc).** When two CDI
  beans (e.g. `SchemaInitializer` and `ManagedFlyway`) both called `getConnection()` during
  context startup before either resolved, `SingleConnectionDataSource` created two separate
  in-memory databases, silently discarding the first. Fixed with a promise-mutex
  (`_connectionPromise`) — only one connection is ever created regardless of concurrent callers.

- **`SchemaInitializer` SQL comment stripping (boot-jsdbc).** Statements whose first line was
  a `--` comment were silently dropped: the filter `!s.startsWith('--')` was applied to the
  whole chunk after splitting on `;`, so `-- comment\nCREATE TABLE ...` was discarded entirely.
  Fixed by stripping comment lines per-chunk before filtering empty statements.

- **`SchemaInitializer` async race (boot-jsdbc).** `init()` is async but CDI does not await
  it, so dependent beans could query the database before schema was applied. Fixed by storing
  `_initPromise` in `init()` and exposing `ready()` — same pattern as `ManagedFlyway`.

- **Duck-type config check in `Boot.detectConfig()`.** Replaced `instanceof ValueResolvingConfig`
  guard with a `has()`/`get()` interface check, so `ProfileAwareConfig`, `EphemeralConfig`, and
  any future config types pass through without being unnecessarily wrapped.

- **`Boot.boot()` copy-paste bug: `loggerCategoryCacheArg`.** Assignment read
  `context.loggerFactory` instead of `context.loggerCategoryCache`, so the logger category cache
  was never passed through to the boot context.

- **`Boot.boot()` assignment bug: `$loggerCategoryCache`.** `$config` was incorrectly assigned
  `window.loggerCategoryCache` instead of `$loggerCategoryCache`.

- **`@alt-javascript/boot-vue` — `Boot.boot()` not called before `ApplicationContext`.** The
  Vue integration was creating `ApplicationContext` without first calling `Boot.boot({ config })`,
  so the global root was never populated and component wiring failed in CDN/no-build usage.

### New features

- **Startup banner inlined into `ApplicationContext`.** The banner is now a string constant
  inside `ApplicationContext.js` — no filesystem access, no async I/O. Works in browser and
  Node without modification. Controlled by `boot.banner-mode`:
  - `console` (default, matches Spring Boot behaviour) — prints to `stdout`
  - `log` — routes through the configured `@alt-javascript/logger` at `info` level
  - `off` — suppressed entirely

- **Banner version resolved at runtime.** The version line (`@alt-javascript/boot :: x.y.z`) is
  read from `package.json` via `createRequire(import.meta.url)`. In browser environments it
  shows as `(browser)`.

- **Banner suppressed in test mode.** `Boot.test()` injects `banner-mode: off` so test output
  stays clean without changes to individual test fixtures.

### Config key reference

- `boot.datasource.*` — SQL datasource (primary); secondary via `DataSourceBuilder.create().prefix()`
- `boot.flyway.*` — Flyway migrations (primary); secondary via `flywayStarter({ prefix })`
- `boot.nosql.*` — NoSQL client (primary); secondary via `NoSqlClientBuilder.create().prefix()`

## 3.0.3 — 2026-03-21

### Bug fixes

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

## 3.0.2 — 2026-03-21

### Bug fixes

- **`@alt-javascript/common` publishConfig missing.** The package was missing
  `"publishConfig": { "access": "public" }`, causing npm to reject the publish with a 402
  Payment Required error. Added to match all other scoped packages in the monorepo.

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
