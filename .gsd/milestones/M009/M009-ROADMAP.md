# M009: Persistence, Advanced Features & Examples

**Vision:** Extend `@alt-javascript/boot` with convention-over-configuration persistence
(auto-wired `DataSource` + `JsdbcTemplate` from config), ship the advanced-features example
deferred from M008, and encode all project conventions in a GSD skill.

## Success Criteria

- `jsdbcTemplateStarter()` wires `DataSource` + `JsdbcTemplate` from `datasource.*` config automatically
- `example-5-1-advanced` demonstrates AOP, events, conditional beans, BeanPostProcessor, constructor injection
- `programming-altjs` skill committed and self-validating
- All existing tests remain green throughout
- Human sign-off at each slice

## Key Risks / Unknowns

- jsdbc driver API surface not yet audited — need to understand `DataSource` constructor signature before designing the starter
- Multiple driver types (SQLite, MySQL, Postgres) may need different factory paths — research first
- Constructor injection interaction with `BeanPostProcessor` in advanced example needs careful ordering

## Proof Strategy

- Research jsdbc driver API before committing to the starter interface
- Unit-test the starter with a SQLite in-memory driver (no external DB required)
- Advanced example: mocha integration test, not just unit test

## Slices

- [ ] **S01: jsdbc Driver Research** `risk:low` `depends:[]`
- [ ] **S02: DataSourceStarter + JsdbcTemplateStarter packages** `risk:medium` `depends:[S01]`
- [ ] **S03: example-5-2-persistence-jsdbc** `risk:low` `depends:[S02]`
- [ ] **S04: Advanced Features Example (example-5-1-advanced)** `risk:medium` `depends:[]`
- [ ] **S05: programming-altjs GSD Skill** `risk:low` `depends:[S04]`
