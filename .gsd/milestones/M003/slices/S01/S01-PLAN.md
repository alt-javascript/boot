# S01: Circular Dependency Detection + Initialization Ordering

**Goal:** ApplicationContext detects circular singleton dependencies at startup with a clear error message, and supports `dependsOn` to control initialization ordering.
**Demo:** Two singletons that reference each other produce an error like "Circular dependency detected: classA → classB → classA". A singleton with `dependsOn: ['config']` is initialized after config.

## Must-Haves

- Circular dependency detection during singleton dependency injection
- Error message names the full cycle path (e.g., "classA → classB → classA")
- `dependsOn` property on component definitions
- Topological sort for initialization ordering based on `dependsOn`
- Error when `dependsOn` references a non-existent component
- All 276 existing tests still pass

## Verification

- `cd /Users/craig/src/github/alt-javascript/altjs && npm test` — all 276+ tests pass
- `cd /Users/craig/src/github/alt-javascript/altjs/packages/cdi && npx mocha --require test/fixtures/index.js test/CircularDeps.spec.js` — circular dep tests pass
- `cd /Users/craig/src/github/alt-javascript/altjs/packages/cdi && npx mocha --require test/fixtures/index.js test/DependsOn.spec.js` — dependsOn tests pass

## Tasks

- [ ] **T01: Circular dependency detection in autowiring** `est:45m`
  - Why: Prevent infinite loops / stack overflows when singletons reference each other
  - Files: `packages/cdi/ApplicationContext.js`
  - Do: Track a resolution stack during `autowireComponentDependencies` / `get()`. When resolving a singleton reference, push the current component name onto the stack. If the target name is already in the stack, throw with the full cycle path. Pop on return. The stack should be an instance property (`this._resolutionStack`) reset before each injection pass.
  - Verify: Circular pair throws; non-circular chain resolves normally
  - Done when: Circular singletons produce clear error, non-circular cases unaffected

- [ ] **T02: dependsOn and initialization ordering** `est:45m`
  - Why: Some beans need to be initialized after their dependencies (e.g., a cache that needs config first)
  - Files: `packages/cdi/ApplicationContext.js`
  - Do: 1) Carry `dependsOn` from componentArg through parseContextComponent. 2) Before `initialiseSingletons`, build a dependency graph from `dependsOn` declarations and topological-sort the initialization order. 3) Error if `dependsOn` names a non-existent component. 4) Error if `dependsOn` creates a cycle.
  - Verify: Init order follows dependsOn; missing ref throws; cycle throws
  - Done when: Initialization order respects dependsOn declarations

- [ ] **T03: Tests for circular deps and dependsOn** `est:30m`
  - Why: Prove both features work, including edge cases
  - Files: `packages/cdi/test/CircularDeps.spec.js`, `packages/cdi/test/DependsOn.spec.js`
  - Do: Tests: 1) Direct circular pair (A→B→A) throws with cycle message. 2) Indirect cycle (A→B→C→A) throws. 3) Non-circular chain resolves fine. 4) Self-referential property detected. 5) dependsOn controls init order. 6) dependsOn missing ref throws. 7) dependsOn cycle throws. 8) Multiple dependsOn entries work. 9) Components without dependsOn initialize normally.
  - Verify: All tests pass, full suite 276+ green
  - Done when: All edge cases covered

## Files Likely Touched

- `packages/cdi/ApplicationContext.js`
- `packages/cdi/test/CircularDeps.spec.js`
- `packages/cdi/test/DependsOn.spec.js`
