# S01: Circular Dependency Detection + Initialization Ordering

**Goal:** ApplicationContext detects circular singleton dependencies at startup with a clear error message, and supports `dependsOn` to control initialization ordering.
**Demo:** After this: circular singleton dependencies produce a clear error naming the cycle; `dependsOn` controls singleton initialization order

## Tasks
- [x] **T01: Circular dependency detection in autowiring** — 
  - Files: packages/cdi/ApplicationContext.js
  - Verify: Circular pair throws; non-circular chain resolves normally
- [x] **T02: dependsOn and initialization ordering** — 
  - Files: packages/cdi/ApplicationContext.js
  - Verify: Init order follows dependsOn; missing ref throws; cycle throws
- [x] **T03: Tests for circular deps and dependsOn** — 
  - Files: packages/cdi/test/CircularDeps.spec.js, packages/cdi/test/DependsOn.spec.js
  - Verify: All tests pass, full suite 276+ green
