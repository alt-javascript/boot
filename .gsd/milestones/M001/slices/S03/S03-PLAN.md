# S03: Container Enhancement PoCs

**Goal:** Prove that AOP method interception, an application event bus, and conditional bean registration work in pure JS within the existing framework architecture.
**Demo:** Three PoC modules with passing tests: Proxy-based AOP, isomorphic event publisher/subscriber, and condition-based component registration.

## Must-Haves

- AOP: Before/after/around advice on singleton methods via JS Proxy
- Events: Isomorphic event bus (no Node EventEmitter dependency) with publish/subscribe within container
- Conditional registration: Register beans only when config property matches, when another bean exists/missing
- All three work in pure JS ESM
- All tests pass in the existing mocha + chai harness

## Proof Level

- This slice proves: contract + integration
- Real runtime required: yes — tests run in Node.js
- Human/UAT required: yes — user evaluates API design

## Verification

- `npm test` passes (all existing + new tests)
- Each PoC has at least 5 focused tests

## Tasks

- [x] **T01: AOP method interception PoC** `est:1h`
  - Why: AOP is a P1 gap — Proxy-based interception is the most natural JS equivalent to Spring's AOP proxying
  - Files: `poc/Aop.js`, `test/aop.spec.js`
  - Do: Implement a `createProxy(target, aspects)` function that wraps an object in a Proxy with method interception. Support before, after, afterReturning, afterThrowing, and around advice. Aspects match methods by name pattern (string or regex). Write tests proving: before logging, after timing, around retry, error interception, selective method matching.
  - Verify: `npx mocha --require test/fixtures/index.js test/aop.spec.js`
  - Done when: 5+ tests pass showing all advice types working

- [x] **T02: Application event system PoC** `est:1h`
  - Why: Events are a P1 gap — decoupled component communication is core Spring value
  - Files: `poc/Events.js`, `test/events.spec.js`
  - Do: Implement an `ApplicationEventPublisher` that components can subscribe to and publish events on. Must be isomorphic (no Node EventEmitter — use a simple Map-based implementation). Support: typed events (class-based), wildcard/pattern subscriptions, lifecycle events (ContextRefreshed, ContextClosed). Write tests proving: pub/sub, multiple listeners, event ordering, lifecycle events.
  - Verify: `npx mocha --require test/fixtures/index.js test/events.spec.js`
  - Done when: 5+ tests pass showing pub/sub and lifecycle events

- [x] **T03: Conditional bean registration PoC** `est:1h`
  - Why: Conditional registration is what makes Spring Boot's auto-configuration smart
  - Files: `poc/Conditions.js`, `test/conditions.spec.js`
  - Do: Implement condition functions: `conditionalOnProperty(path, value)`, `conditionalOnMissingBean(name)`, `conditionalOnClass(className)`. Each returns a predicate that receives the current context state and config. Integrate with component definitions — a component with a `condition` property is only registered if the condition passes. Write tests proving: property-based conditional, missing-bean conditional, class availability check.
  - Verify: `npx mocha --require test/fixtures/index.js test/conditions.spec.js`
  - Done when: 5+ tests pass showing conditional registration working

## Files Likely Touched

- `poc/Aop.js`, `poc/Events.js`, `poc/Conditions.js`
- `test/aop.spec.js`, `test/events.spec.js`, `test/conditions.spec.js`
