---
slice: S01
status: complete
completed: 2026-03-24
commit: 24e309f
---

# S01 Summary — jsdbc Driver Research

Audited the full `@alt-javascript/jsdbc` API surface. Produced `S01-RESEARCH.md` with
complete driver/template interface documentation, design rationale for `jsdbcTemplateStarter()`,
and the decision to use `@alt-javascript/jsdbc-sqljs` as the test driver (zero native deps,
runs in CI).

Key findings carried forward to S02:
- `DataSource`, `SingleConnectionDataSource`, `PooledDataSource` from `jsdbc-core`
- In-memory URLs require `SingleConnectionDataSource` (shared connection, avoids empty-DB problem)
- Driver self-registration via import side-effect — starter stays driver-agnostic
- `jsdbcAutoConfiguration()` correctly belongs in `boot-jsdbc`, not `jsdbc-template` (corrected in S02)
