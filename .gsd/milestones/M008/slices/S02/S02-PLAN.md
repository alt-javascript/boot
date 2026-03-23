# S02 Plan — Express

## Goal

Build `packages/example-2-1-servers-express` demonstrating idiomatic `@alt-javascript/boot-express`
usage: Boot.boot() + context + expressAutoConfiguration(), one REST controller, health endpoint,
profile-driven port.

## Context

`@alt-javascript/boot-express` provides:
- `ExpressAdapter` — CDI singleton; `init()` creates Express app + registers routes, `run()`
  listens, `destroy()` closes server
- `ControllerRegistrar` — two patterns: `static __routes` (declarative) or `routes(app, ctx)` (imperative)
- `expressAutoConfiguration()` — returns `[expressAdapter]` component definition

The Boot.boot() pattern from example-1-5 extends naturally: add `...expressAutoConfiguration()`
to the Context and the server starts automatically.

## Tasks

- [ ] **T01: Scaffold package** `est:15m`
  - `packages/example-2-1-servers-express/`
  - `package.json` — name, deps (`@alt-javascript/boot`, `@alt-javascript/cdi`, `@alt-javascript/boot-express`)
  - `config/application.json` — server.port, app.name, logging
  - `config/application-dev.json` — dev port override

- [ ] **T02: Services** `est:20m`
  - `src/services.js` — `GreetingService` (static qualifier, `${app.greeting:Hello}` placeholder)
  - `src/controllers.js` — `GreetingController` with `static __routes` declarative pattern:
    - `GET /` → health check (name + version from config)
    - `GET /greet/:name` → `greetingService.greet(name)`
  - `Application` class with `run()` — logs startup URL

- [ ] **T03: Entry point** `est:10m`
  - `main.js` — Boot.boot({ contexts: [context] }), context includes expressAutoConfiguration()
  - Clean: ~10 meaningful lines

- [ ] **T04: Verify** `est:15m`
  - `npm start` — server listens on port 3000, curl `GET /` returns health JSON
  - `npm run start:dev` — port changes (e.g. 3001)
  - `GET /greet/World` — returns greeting JSON
  - SIGINT exits cleanly (ExpressAdapter.destroy() closes server)

## Definition of Done

- Server starts, responds to `GET /` and `GET /greet/:name`
- Profile changes port
- Clean shutdown on SIGINT
- S02-UAT.md checklist complete with human sign-off
