# S03: Container Enhancement PoCs — UAT

## Prerequisites
- `npm test` passes (74 tests)
- Files: `poc/Aop.js`, `poc/Events.js`, `poc/Conditions.js` + corresponding test files

## Test Steps

### 1. AOP
- [ ] Run `npx mocha --require test/fixtures/index.js test/aop.spec.js` — 14 tests pass
- [ ] Review before/after/around advice — does the API feel natural for JS?
- [ ] Review pointcut matching — string, wildcard, regex, predicate options

### 2. Events
- [ ] Run `npx mocha --require test/fixtures/index.js test/events.spec.js` — 13 tests pass
- [ ] Review typed subscription and wildcard — is the API ergonomic?
- [ ] Confirm no Node EventEmitter import (grep for 'events' in poc/Events.js)

### 3. Conditions
- [ ] Run `npx mocha --require test/fixtures/index.js test/conditions.spec.js` — 21 tests pass
- [ ] Review conditionalOnProperty, conditionalOnMissingBean — do these map well to Spring Boot patterns?
- [ ] Review allOf/anyOf composition

### 4. Integration
- [ ] Run `npm test` — all 74 tests pass, zero regressions
