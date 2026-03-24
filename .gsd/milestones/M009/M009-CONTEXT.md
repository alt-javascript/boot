# M009 Context — Persistence, Advanced Features & Examples

**Milestone:** M009
**Status:** Planned

## Goal

Extend the `@alt-javascript` framework with two capabilities:

1. **Persistence** — a `jsdbcTemplateStarter()` that automates `DataSource` and `JsdbcTemplate` bean wiring from configuration properties, mirroring Spring Boot's `spring.datasource.*` auto-configuration pattern.

2. **Advanced Features** — the example and documentation deferred from M008 (AOP, events, conditional beans, `BeanPostProcessor`, constructor injection), plus the `programming-altjs` GSD skill.

## Scope

### Persistence (new capability)

Goal: a developer imports `@alt-javascript/boot-jsdbc` and calls `jsdbcTemplateStarter()`. That call:

- Reads `datasource.*` properties from the active config profile
- Detects the jsdbc driver from the `datasource.driver` property (or from the installed jsdbc package)
- Instantiates a `DataSource` bean and a `JsdbcTemplate` bean
- Registers both in the CDI `ApplicationContext`
- Exposes both for `@Autowired` injection in user components

The pattern mirrors Spring Boot's `DataSourceAutoConfiguration` → renamed to `DataSourceStarter` per project conventions.

### Advanced Features (deferred from M008 S14)

- `example-5-1-advanced` package: AOP, `BeanPostProcessor`, application events, conditional beans, constructor injection — all in one runnable example
- `programming-altjs` GSD skill (S15)

## Constraints

- Human sign-off required before each slice proceeds
- `npm test` must stay green at every commit
- `*Starter` naming convention throughout
- Deprecated aliases retained when renaming

## Out of Scope

- ORM / query builder (jsdbc handles that layer already)
- Connection pool management beyond what jsdbc provides
- Full Spring Data equivalent (not planned for this milestone)
