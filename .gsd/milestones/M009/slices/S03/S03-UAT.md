---
slice: S03
status: validated
---

# S03 UAT — example-5-2-persistence-jsdbc

## Acceptance Criteria

- [x] `jsdbcTemplateStarter()` wires `NoteRepository.jsdbcTemplate` automatically
- [x] `init()` creates schema and seeds 2 rows
- [x] `findAll()` returns rows with correct fields (id, title, body, done)
- [x] `save()` inserts and returns new ID
- [x] `markDone()` flips the done flag
- [x] `remove()` deletes by ID
- [x] 5 mocha tests pass; full regression green

## Verified

Commit `e88d1df`. 5 passing. 24/24 suites green.
