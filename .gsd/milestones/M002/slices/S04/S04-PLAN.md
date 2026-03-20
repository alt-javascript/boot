# S04: AOP + Constructor Injection + Integration

**Goal:** ApplicationContext supports AOP proxy wrapping via BeanPostProcessor, constructor injection from context, aware interfaces, and an integrated test exercises all v3.0 features together. Browser ESM bundles build from monorepo.
**Demo:** A component is auto-discovered, conditionally registered, has constructor args injected, receives ApplicationContext via aware interface, gets AOP-proxied for logging, and publishes events — all in one integrated test.

## Must-Haves

- AOP `createProxy(target, aspects)` integrated into cdi package
- AOP applied via BeanPostProcessor `postProcessAfterInitialization`
- Constructor injection: `constructorArgs` resolved from context during singleton creation
- Aware interface: `setApplicationContext(ctx)` called during initialization
- Integrated test combining: auto-discovery → conditions → BeanPostProcessor → AOP → events → constructor injection
- Browser ESM bundle builds from cdi package without errors
- All 255 existing tests still pass

## Proof Level

- This slice proves: final-assembly
- Real runtime required: yes
- Human/UAT required: yes (API ergonomics review)

## Verification

- `cd /Users/craig/src/github/alt-javascript/altjs && npm test` — all 255+ tests pass
- `cd /Users/craig/src/github/alt-javascript/altjs/packages/cdi && npx mocha --require test/fixtures/index.js test/Aop.spec.js` — AOP tests pass
- `cd /Users/craig/src/github/alt-javascript/altjs/packages/cdi && npx mocha --require test/fixtures/index.js test/Integration.spec.js` — integrated scenario passes
- `cd /Users/craig/src/github/alt-javascript/altjs/packages/cdi && npx rollup -c rollup.config.esm.js` — browser bundle builds

## Tasks

- [ ] **T01: AOP module and constructor injection in ApplicationContext** `est:1h`
  - Why: Core AOP and constructor injection features needed before the integrated test
  - Files: `packages/cdi/Aop.js`, `packages/cdi/ApplicationContext.js`, `packages/cdi/index.js`
  - Do: 1) Port Aop.js (createProxy, matchMethod) into cdi package. 2) In createSingletons, support `constructorArgs` — resolve each arg name from context via `this.get()` before calling `new component.Reference(...resolvedArgs)`. 3) In initialiseSingletons, after init() call, check for `setApplicationContext` method and call it with `this`. 4) Export createProxy and matchMethod from cdi index.
  - Verify: `node -e "import { createProxy } from '@alt-javascript/cdi'"` resolves
  - Done when: AOP, constructor injection, and aware interfaces all wired into ApplicationContext

- [ ] **T02: AOP and constructor injection tests** `est:45m`
  - Why: Prove AOP proxying via BeanPostProcessor, constructor injection, and aware interfaces work
  - Files: `packages/cdi/test/Aop.spec.js`, `packages/cdi/test/ConstructorInjection.spec.js`
  - Do: Test AOP: 1) createProxy with before/after/around advice. 2) BeanPostProcessor that applies AOP proxy. 3) Proxied bean retrieved from context. Test constructor injection: 1) Component with constructorArgs gets dependencies injected via constructor. 2) Aware interface: bean with setApplicationContext receives context reference.
  - Verify: `npx mocha --require test/fixtures/index.js test/Aop.spec.js test/ConstructorInjection.spec.js`
  - Done when: All AOP and constructor injection tests pass

- [ ] **T03: Integrated scenario test** `est:30m`
  - Why: Prove all v3.0 features work together end-to-end
  - Files: `packages/cdi/test/Integration.spec.js`
  - Do: Single test: auto-discovered class (static __component) with conditionalOnProperty, constructor injection of a dependency, AOP logging aspect applied via BeanPostProcessor, aware interface receiving context, publishing custom event after initialization, convention listener receiving it. Assert all features exercised.
  - Verify: `npx mocha --require test/fixtures/index.js test/Integration.spec.js`
  - Done when: Integrated scenario exercises all 6 v3.0 features in one ApplicationContext

- [ ] **T04: Browser bundle build** `est:30m`
  - Why: Verify cdi browser ESM bundle builds with new modules included
  - Files: `packages/cdi/rollup.config.esm.js`
  - Do: Update rollup config to include new modules (BeanPostProcessor, events, AutoDiscovery, Conditions, Aop). Update import map for @alt-javascript/common. Run build, verify output exists and is valid ES module.
  - Verify: `cd packages/cdi && npx rollup -c rollup.config.esm.js` exits 0
  - Done when: Browser ESM bundle builds without errors, includes all v3.0 exports

## Files Likely Touched

- `packages/cdi/Aop.js`
- `packages/cdi/ApplicationContext.js`
- `packages/cdi/index.js`
- `packages/cdi/rollup.config.esm.js`
- `packages/cdi/test/Aop.spec.js`
- `packages/cdi/test/ConstructorInjection.spec.js`
- `packages/cdi/test/Integration.spec.js`
