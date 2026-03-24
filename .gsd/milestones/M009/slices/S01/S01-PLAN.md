# S01 Plan — jsdbc Driver Research

## Objective

Audit the `@alt-javascript/jsdbc` API surface to produce an accurate design spec for
`packages/boot-jsdbc` (S02). No code shipped in this slice.

## Tasks

- [x] **T01: Read jsdbc-core README and interfaces** `est:30min`
- [x] **T02: Read jsdbc-template source (JsdbcAutoConfiguration, JsdbcTemplate)** `est:30min`
- [x] **T03: Read jsdbc-sqljs README (test driver)** `est:15min`
- [x] **T04: Read existing auto-configuration tests** `est:15min`
- [x] **T05: Document findings and design decision in S01-RESEARCH.md** `est:30min`

## Definition of Done

S01-RESEARCH.md committed with:
- Full API surface documented
- Design decision for `jsdbcTemplateStarter()` recorded
- Driver self-registration pattern documented
- Test strategy confirmed (sqljs, in-memory)
