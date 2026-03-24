# S02 Plan — boot-jsdbc Persistence Starter

## Objective

Build `packages/boot-jsdbc` — the CDI auto-configuration starter for JSDBC.
Ships `jsdbcTemplateStarter()`, `jsdbcAutoConfiguration()`, `ConfiguredDataSource`,
`DataSourceBuilder`, and `SchemaInitializer`.

## Tasks

- [x] **T01: Scaffold package** `est:30min`
- [x] **T02: ConfiguredDataSource with pool/in-memory detection** `est:1h`
- [x] **T03: jsdbcAutoConfiguration() — conditional CDI component defs** `est:1h`
- [x] **T04: jsdbcTemplateStarter() — Boot.boot() wrapper** `est:30min`
- [x] **T05: Tests (JsdbcTemplateStarter.spec.js)** `est:1h`
- [x] **T06: Move jsdbcAutoConfiguration from jsdbc-template → boot-jsdbc (breaking)** `est:30min`
- [x] **T07: boot.datasource.* prefix, DataSourceBuilder, SchemaInitializer** `est:2h`

## Definition of Done

- `npm test -w packages/boot-jsdbc` green (11 tests originally, 24 after T06–T07)
- Full regression green (24 suites)
- Breaking change committed with `fix!:` prefix and changelog note
