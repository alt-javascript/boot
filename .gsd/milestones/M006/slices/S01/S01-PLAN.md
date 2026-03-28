# S01: Express Adapter + Controller Convention

**Goal:** A reusable `@alt-javascript/boot-express` adapter that boots Express inside CDI, auto-registers controller routes, and exposes the ApplicationContext to route handlers.
**Demo:** After this: An Express app boots via ApplicationContext with CDI-managed services, route handlers access beans, controllers auto-register routes — proven by tests using supertest

## Tasks
- [x] **T01: Express adapter core + auto-configuration** — 
  - Files: packages/boot-express/ExpressAdapter.js, packages/boot-express/index.js, packages/boot-express/package.json
  - Verify: Unit test that boots ApplicationContext with expressAutoConfiguration, verifies adapter creates Express app
- [x] **T02: Controller convention + route auto-registration** — 
  - Files: packages/boot-express/ControllerRegistrar.js, packages/boot-express/ExpressAdapter.js
  - Verify: Test with a controller class that has `__routes`, verify routes respond correctly via supertest
- [x] **T03: Integration tests with supertest** — 
  - Files: packages/boot-express/test/ExpressAdapter.spec.js
  - Verify: `npm test -w packages/boot-express` — all pass
