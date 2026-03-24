---
slice: S02
status: complete
completed: 2026-03-24
commits: f8c38bf, ea3c179, 747f325
---

# S02 Summary — boot-jsdbc Persistence Starter

Built `packages/boot-jsdbc` across three commits, each adding a layer:

**`f8c38bf` — initial starter:**
- `ConfiguredDataSource` — CDI-aware; reads `jsdbc.*` config (later renamed)
- `jsdbcAutoConfiguration()` — conditional component defs for dataSource/jsdbcTemplate/namedParameterJsdbcTemplate
- `jsdbcTemplateStarter()` — `Boot.boot()` wrapper; user contexts first so custom dataSource is detected
- `jsdbcStarter()` — bare component array re-export
- 11 tests green

**`ea3c179` — breaking: moved auto-config out of jsdbc-template:**
- `JsdbcAutoConfiguration.js` moved from `jsdbc-template` to `boot-jsdbc`
- `ConfiguredDataSource` moves with it — it uses `setApplicationContext` lifecycle
- `jsdbc-template@3.1.0`: CDI-free; exports only template classes
- All adapter package.json deps updated from pinned `3.0.4` to `*`

**`747f325` — prefix, DataSourceBuilder, SchemaInitializer:**
- Config prefix: `jsdbc.*` → `boot.datasource.*` (breaking, consistent with Spring)
- Custom prefix via `jsdbcAutoConfiguration({ prefix })` / `jsdbcTemplateStarter({ prefix })`
- `DataSourceBuilder` — fluent builder for named/secondary datasources
- `SchemaInitializer` — runs `config/schema.sql` + `config/data.sql` on start; respects `boot.datasource.initialize`; silently skips missing files
- `jsdbcAutoConfiguration()` now implemented as `DataSourceBuilder.create().prefix(p).build()`
- 24 tests green; all 24 suites green
