# S02: Component Auto-Discovery PoC — UAT

## Prerequisites
- `npm test` passes (26 tests)
- Files: `poc/AutoDiscovery.js`, `test/autodiscovery.spec.js`

## Test Steps

### 1. API Ergonomics
- [ ] Review `poc/AutoDiscovery.js` — is the static `__component` property intuitive?
- [ ] Compare before (explicit registration) vs after (static property) — is this a meaningful improvement?
- [ ] Review the three declaration forms: `true`, `'prototype'`, `{scope, profiles, ...}`

### 2. Test Coverage
- [ ] Run `npx mocha --require test/fixtures/index.js test/autodiscovery.spec.js`
- [ ] Verify: singleton discovery, prototype discovery, profile filtering, autowiring all work
- [ ] Run `npm test` — verify no regressions in existing tests

### 3. Pure JS Validation
- [ ] Confirm no decorators, no TypeScript, no transpiler required
- [ ] Confirm all code is standard ES module syntax
