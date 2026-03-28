# S04: AOP + Constructor Injection + Integration

**Goal:** ApplicationContext supports AOP proxy wrapping via BeanPostProcessor, constructor injection from context, aware interfaces, and an integrated test exercises all v3.0 features together. Browser ESM bundles build from monorepo.
**Demo:** After this: AOP proxies applied via BeanPostProcessor; constructor args resolved from context; aware interfaces work; integrated scenario exercises all features together; browser bundles build

## Tasks
- [x] **T01: AOP module and constructor injection in ApplicationContext** — 
  - Files: packages/cdi/Aop.js, packages/cdi/ApplicationContext.js, packages/cdi/index.js
  - Verify: `node -e "import { createProxy } from '@alt-javascript/cdi'"` resolves
- [x] **T02: AOP and constructor injection tests** — 
  - Files: packages/cdi/test/Aop.spec.js, packages/cdi/test/ConstructorInjection.spec.js
  - Verify: `npx mocha --require test/fixtures/index.js test/Aop.spec.js test/ConstructorInjection.spec.js`
- [x] **T03: Integrated scenario test** — 
  - Files: packages/cdi/test/Integration.spec.js
  - Verify: `npx mocha --require test/fixtures/index.js test/Integration.spec.js`
- [x] **T04: Browser bundle build** — 
  - Files: packages/cdi/rollup.config.esm.js
  - Verify: `cd packages/cdi && npx rollup -c rollup.config.esm.js` exits 0
