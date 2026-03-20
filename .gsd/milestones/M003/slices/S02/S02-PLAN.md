# S02: Primary Beans + Lifecycle + Error Messages

**Goal:** `primary: true` resolves bean ambiguity; singletons with `start()`/`stop()` participate in formal lifecycle; startup errors include bean name and phase.
**Demo:** Two implementations registered for the same qualifier, one marked `primary: true` — get() returns the primary. Singletons with `start()` called during run phase, `stop()` registered for shutdown.

## Must-Haves

- `primary: true` on component definitions marks the preferred bean
- When multiple beans match, `primary` takes precedence
- `start()` method called during run phase for singletons that have it
- `stop()` method registered as destroyer for ordered shutdown
- Error messages include bean name and lifecycle phase
- All 287 existing tests still pass

## Verification

- `cd /Users/craig/src/github/alt-javascript/altjs && npm test` — all 287+ tests pass
- `cd /Users/craig/src/github/alt-javascript/altjs/packages/cdi && npx mocha --require test/fixtures/index.js test/Primary.spec.js test/Lifecycle.spec.js`

## Tasks

- [ ] **T01: Primary beans and lifecycle interfaces** `est:45m`
  - Why: Primary beans resolve ambiguity; lifecycle interfaces formalize component start/stop
  - Files: `packages/cdi/ApplicationContext.js`
  - Do: 1) Carry `primary` from componentArg through parseContextComponent. 2) In parseContextComponent, when a duplicate is found AND the new one is `primary: true`, replace the existing instead of throwing. 3) In `run()`, call `start()` on singletons that have it. 4) In `registerSingletonDestroyers`, register `stop()` methods.
  - Verify: `npm test` — 287 tests pass
  - Done when: Primary beans replace non-primary; start/stop lifecycle works

- [ ] **T02: Tests** `est:30m`
  - Files: `packages/cdi/test/Primary.spec.js`, `packages/cdi/test/Lifecycle.spec.js`
  - Do: Tests: 1) primary replaces existing non-primary. 2) Non-primary duplicate still throws. 3) start() called during run phase. 4) stop() registered for shutdown. 5) Beans without start/stop unaffected.
  - Verify: All new tests pass, full suite green
  - Done when: All tests pass, 287+ total

## Files Likely Touched

- `packages/cdi/ApplicationContext.js`
- `packages/cdi/test/Primary.spec.js`
- `packages/cdi/test/Lifecycle.spec.js`
