# S02: Component Auto-Discovery PoC

**Goal:** Prove that components can self-register into ApplicationContext without explicit `new Component(MyClass)` boilerplate, using pure JS mechanisms that work in flat ESM browser environments.
**Demo:** Test file demonstrates classes with static metadata properties being auto-discovered and registered into an ApplicationContext — tests pass in the existing mocha harness.

## Must-Haves

- Components declare themselves via a pure JS mechanism (no decorators, no transpiler)
- ApplicationContext can discover and register these components without manual wrapping
- Works with existing singleton/prototype scopes
- Works with existing profiles
- Tests pass in the existing mocha + chai test harness
- Mechanism works in ESM (no require(), no CommonJS)

## Proof Level

- This slice proves: contract + integration
- Real runtime required: yes — tests run in Node.js
- Human/UAT required: yes — user evaluates API ergonomics

## Verification

- `npm test` passes (existing tests not broken)
- New PoC test file passes: `npx mocha --require test/fixtures/index.js test/autodiscovery.spec.js`

## Tasks

- [x] **T01: Design and implement auto-discovery mechanism** `est:1.5h`
  - Why: The core PoC — define how classes declare themselves as components and how the context discovers them
  - Files: `poc/AutoDiscovery.js`, `test/autodiscovery.spec.js`
  - Do: Design three approaches for pure JS component marking: (1) static class properties (`static __component = {scope: 'singleton'}`), (2) registration helper functions (`register(MyClass, {scope: 'singleton'})`), (3) manifest/module-export convention. Implement the most promising approach as a standalone module. Write comprehensive tests covering: basic registration, singleton/prototype scopes, profiles, and integration with existing ApplicationContext.
  - Verify: `npx mocha --require test/fixtures/index.js test/autodiscovery.spec.js` passes
  - Done when: Auto-discovered components are created, injected, and retrievable from ApplicationContext without `new Component()` wrapping

- [x] **T02: Validate existing tests and document findings** `est:30m`
  - Why: Ensure the PoC doesn't break existing behavior, and capture design decisions for S04 synthesis
  - Files: `test/autodiscovery.spec.js`
  - Do: Run full test suite (`npm test`). Document the chosen approach, its tradeoffs vs alternatives, and what it means for the v3.0 API design. Write task summary.
  - Verify: `npm test` passes (all existing + new tests)
  - Done when: Full test suite green, design findings documented

## Files Likely Touched

- `poc/AutoDiscovery.js` — Auto-discovery mechanism implementation
- `test/autodiscovery.spec.js` — PoC tests
