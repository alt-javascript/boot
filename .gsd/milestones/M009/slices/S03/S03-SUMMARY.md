---
slice: S03
status: complete
completed: 2026-03-24
commit: e88d1df
---

# S03 Summary — example-5-2-persistence-jsdbc

Built `packages/example-5-2-persistence-jsdbc` — full CRUD via `JsdbcTemplate` with
in-memory sql.js database.

**Files:**
- `config/application.json` — `boot.datasource.url: jsdbc:sqljs:memory`
- `src/services.js` — `NoteRepository` (init/findAll/findById/save/markDone/remove) + `Application` demo
- `main.js` — `import '@alt-javascript/jsdbc-sqljs'`; `jsdbcTemplateStarter({ contexts })`
- `test/services.spec.js` — 5 CRUD tests; `beforeEach` boots fresh in-memory context

**Notable:** `SchemaInitializer` not yet used in this example (schema created in `NoteRepository.init()`);
this is intentional — demonstrates manual schema control vs auto-init.

5 tests green. Config updated to `boot.datasource.*` prefix after S02 refactor.
