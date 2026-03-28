# S02: Primary Beans + Lifecycle + Error Messages

**Goal:** `primary: true` resolves bean ambiguity; singletons with `start()`/`stop()` participate in formal lifecycle; startup errors include bean name and phase.
**Demo:** After this: `primary: true` resolves ambiguity; singletons with `start()`/`stop()` participate in formal lifecycle; startup errors include bean name and phase

## Tasks
- [x] **T01: Primary beans and lifecycle interfaces** — 
  - Files: packages/cdi/ApplicationContext.js
  - Verify: `npm test` — 287 tests pass
- [x] **T02: Tests** — 
  - Files: packages/cdi/test/Primary.spec.js, packages/cdi/test/Lifecycle.spec.js
  - Verify: All new tests pass, full suite green
