# S01: Express Adapter + Controller Convention

**Goal:** A reusable `@alt-javascript/boot-express` adapter that boots Express inside CDI, auto-registers controller routes, and exposes the ApplicationContext to route handlers.
**Demo:** Tests using supertest prove: CDI beans resolve from handlers, controllers auto-register routes via `__routes`, config drives server port, lifecycle shutdown works.

## Must-Haves

- `expressAutoConfiguration()` returns CDI component defs that create and manage an Express app
- Controller convention: `__routes` static metadata auto-registers routes at context startup
- Imperative `routes(app, ctx)` method as alternative controller pattern
- ApplicationContext accessible from handlers via `app.locals.ctx`
- Config-driven port/host (`server.port`, `server.host`)
- Graceful shutdown: destroy hook closes HTTP server
- CDI-managed services autowired into controllers

## Proof Level

- This slice proves: contract + integration
- Real runtime required: no (supertest does in-process injection)
- Human/UAT required: no

## Verification

- `npm test -w packages/boot-express` — all adapter and controller tests pass
- Tests cover: boot lifecycle, controller auto-registration, DI resolution from handlers, config injection, graceful shutdown, missing config defaults

## Tasks

- [ ] **T01: Express adapter core + auto-configuration** `est:45m`
  - Why: Creates the reusable adapter package with CDI-managed Express instance
  - Files: `packages/boot-express/ExpressAdapter.js`, `packages/boot-express/index.js`, `packages/boot-express/package.json`
  - Do: Create package. `ExpressAdapter` class is a CDI singleton that creates Express app in `init()`, starts listening in `run()`, closes in `destroy()`. Reads `server.port` (default 3000) and `server.host` (default '0.0.0.0') from config. Sets `app.locals.ctx` to the ApplicationContext. `expressAutoConfiguration()` returns component defs for the adapter (conditional on `server.port` or always-on). Export `ExpressAdapter` and `expressAutoConfiguration`.
  - Verify: Unit test that boots ApplicationContext with expressAutoConfiguration, verifies adapter creates Express app
  - Done when: ExpressAdapter singleton boots, creates Express app, sets app.locals.ctx

- [ ] **T02: Controller convention + route auto-registration** `est:45m`
  - Why: Enables declarative route-to-method mapping on CDI components
  - Files: `packages/boot-express/ControllerRegistrar.js`, `packages/boot-express/ExpressAdapter.js`
  - Do: `ControllerRegistrar` scans CDI components for `__routes` static metadata and `routes()` method. For `__routes`, registers `app[method](path, (req, res, next) => controller[handler](req, res, next))`. For `routes(app, ctx)`, calls the method with the Express app and context. Registration happens during ExpressAdapter `init()` after CDI wiring. Bind handler methods to the controller instance so `this` works.
  - Verify: Test with a controller class that has `__routes`, verify routes respond correctly via supertest
  - Done when: Controllers with `__routes` auto-register, handlers can access `this.service` (autowired)

- [ ] **T03: Integration tests with supertest** `est:30m`
  - Why: Proves the full stack works: boot → CDI → Express → controller → service → response
  - Files: `packages/boot-express/test/ExpressAdapter.spec.js`
  - Do: Install supertest as devDependency. Test scenarios: (1) GET route returns service data, (2) POST route with body, (3) controller accesses CDI bean via autowiring, (4) controller accesses ctx via `req.app.locals.ctx`, (5) config-driven port, (6) missing controller handler error, (7) imperative `routes()` method works. Use EphemeralConfig for all tests. No actual server.listen() — supertest injects.
  - Verify: `npm test -w packages/boot-express` — all pass
  - Done when: 7+ tests covering boot, routing, DI, config, both controller patterns

## Files Likely Touched

- `packages/boot-express/package.json`
- `packages/boot-express/index.js`
- `packages/boot-express/ExpressAdapter.js`
- `packages/boot-express/ControllerRegistrar.js`
- `packages/boot-express/test/ExpressAdapter.spec.js`
- `package.json` (root — add test:express script)
