---
slice: S02
status: validated
---

# S02 UAT — boot-jsdbc Persistence Starter

## Acceptance Criteria

- [x] `jsdbcTemplateStarter()` wires DataSource + JsdbcTemplate from `boot.datasource.*` config
- [x] Custom prefix supported via `{ prefix }` option
- [x] Existing `dataSource` bean is never replaced (conditional correct)
- [x] `DataSourceBuilder` builds named/secondary datasource component sets
- [x] `SchemaInitializer` runs schema.sql + data.sql; skips missing files; respects initialize=false flag
- [x] `jsdbc-template` is CDI-free (no `@alt-javascript/cdi` dep)
- [x] All 24 mocha suites green
- [x] Breaking changes committed with `fix!:` / `feat:` and clear changelog

## Verified

Commits `f8c38bf`, `ea3c179`, `747f325`. 24 passing in boot-jsdbc; full regression 24/24.
