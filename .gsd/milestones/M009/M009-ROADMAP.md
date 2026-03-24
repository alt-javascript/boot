# M009: Persistence, Advanced Features & Examples

**Vision:** Extend `@alt-javascript/boot` with convention-over-configuration persistence
(auto-wired `DataSource` + `JsdbcTemplate` from config), ship the advanced-features example
deferred from M008, and encode all project conventions in a GSD skill.

## Success Criteria

- `jsdbcTemplateStarter()` wires `DataSource` + `JsdbcTemplate` from `boot.datasource.*` config automatically ✅
- `DataSourceBuilder` supports named/secondary datasources ✅
- `SchemaInitializer` auto-runs schema.sql + data.sql on start ✅
- `example-5-1-advanced` demonstrates AOP, events, conditional beans, BeanPostProcessor, constructor injection ✅
- `example-5-2-persistence-jsdbc` demonstrates full CRUD via JsdbcTemplate ✅
- `programming-altjs` skill committed and self-validating
- All existing tests remain green throughout ✅
- Human sign-off at each slice

## Key Risks / Unknowns

- jsdbc driver API surface not yet audited — need to understand `DataSource` constructor signature before designing the starter ✅ (resolved in S01)

## Proof Strategy

- Research jsdbc driver API before committing to the starter interface ✅
- Unit-test the starter with a SQLite in-memory driver (no external DB required) ✅
- Advanced example: mocha integration test, not just unit test ✅

## Slices

- [x] **S01: jsdbc Driver Research** `risk:low` `depends:[]`
- [x] **S02: boot-jsdbc persistence starter** `risk:medium` `depends:[S01]`
- [x] **S03: example-5-2-persistence-jsdbc** `risk:low` `depends:[S02]`
- [x] **S04: Advanced Features Example (example-5-1-advanced)** `risk:medium` `depends:[]`
- [ ] **S05: programming-altjs GSD Skill** `risk:low` `depends:[S04]`

## Breaking Changes Shipped

- `jsdbcAutoConfiguration()` + `ConfiguredDataSource` moved from `jsdbc-template` to `boot-jsdbc` (`ea3c179`)
- Config prefix: `jsdbc.*` → `boot.datasource.*` (`747f325`)
- `jsdbc-template@3.1.0`: CDI-free; removed `@alt-javascript/cdi` dependency
- `boot-jsdbc@3.2.0`: owns all auto-configuration; adds DataSourceBuilder + SchemaInitializer
