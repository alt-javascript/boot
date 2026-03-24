# S05 Plan — programming-altjs GSD Skill

## Objective

Write a `programming-altjs` GSD skill that encodes the full alt-javascript framework
conventions — CDI patterns, Boot lifecycle, config keys, naming conventions, example
structure, and jsdbc usage — so future agents (and contributors) get authoritative
guidance without re-discovering it.

## Tasks

- [ ] **T01: Draft SKILL.md — framework overview and conventions** `est:1h`
- [ ] **T02: CDI section — Singleton/Prototype, autowiring, constructorArgs, BeanPostProcessor, AOP** `est:1h`
- [ ] **T03: Boot section — Boot.boot(), starters, profiles** `est:30min`
- [ ] **T04: Config section — boot.datasource.*, logging.*, app.*, profiles** `est:30min`
- [ ] **T05: Persistence section — DataSourceBuilder, SchemaInitializer, jsdbc ecosystem** `est:30min`
- [ ] **T06: Example structure section — numbering, package layout, test conventions** `est:30min`
- [ ] **T07: Decisions register cross-reference** `est:15min`

## Definition of Done

- `programming-altjs` skill committed under `.gsd/agent/skills/programming-altjs/`
- Skill is self-contained and accurate to current codebase state
- Covers all framework packages shipped through M009
