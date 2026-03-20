# M006: Web / MVC Binding — Framework Integration with Express and Fastify

**Vision:** Developers boot Express or Fastify with one adapter call and get CDI-managed services, config, logging, and lifecycle — while writing idiomatic Express/Fastify code. Application logic lives in framework-agnostic CDI beans; only the HTTP surface touches the framework.

## Success Criteria

- A developer can boot an Express app with `Application.run()` and access CDI beans from route handlers
- A developer can boot a Fastify app with the same service layer, changing only the adapter
- Controllers defined as CDI components auto-register their routes at context startup
- Server port, host, and framework options flow from config (`server.port`, `server.host`)
- Graceful shutdown destroys the CDI context and closes the HTTP server
- The JSDBC auto-configured template works inside route handlers without additional wiring

## Key Risks / Unknowns

- **Ergonomic design** — The adapter must feel natural to Express/Fastify developers, not impose alien patterns. Getting this wrong means nobody uses it.
- **Controller metadata without decorators** — JS has no `@GetMapping`. Need a JS-idiomatic alternative that doesn't feel like boilerplate.
- **Fastify plugin encapsulation** — Fastify's scoped plugin system may conflict with CDI's flat singleton model.

## Proof Strategy

- Ergonomic design → retire in S01 by building the Express adapter and validating that an idiomatic Express app can use CDI beans with minimal ceremony
- Controller metadata → retire in S02 by implementing and testing static route metadata on CDI controller classes
- Fastify encapsulation → retire in S03 by proving the Fastify adapter works with the same controller/service layer

## Verification Classes

- Contract verification: mocha tests for each adapter — server boot, route registration, DI resolution, config injection, lifecycle hooks
- Integration verification: working example apps serving HTTP with CDI-managed JSDBC services
- Operational verification: graceful shutdown (SIGTERM → context close → server close)
- UAT / human verification: run example apps manually, hit endpoints, verify response

## Milestone Definition of Done

This milestone is complete only when all are true:

- Express adapter boots, registers controllers, serves requests with CDI beans, shuts down cleanly
- Fastify adapter does the same with an identical service layer
- At least one example app per adapter demonstrates JSDBC-backed data access
- All tests pass, no additional runtime dependencies beyond the target framework
- The adapter does not require patching or monkey-patching Express/Fastify internals

## Requirement Coverage

- Covers: R001 (IoC/DI extended to HTTP layer), R008 (cross-subsystem integration)
- Partially covers: R006 (lifecycle — server startup/shutdown)
- Leaves for later: security middleware, WebSocket, frontend bindings

## Slices

- [x] **S01: Express Adapter + Controller Convention** `risk:high` `depends:[]`
  > After this: An Express app boots via ApplicationContext with CDI-managed services, route handlers access beans, controllers auto-register routes — proven by tests using supertest
- [x] **S02: Fastify Adapter** `risk:medium` `depends:[S01]`
  > After this: The same service layer from S01 runs behind Fastify with a different adapter — proven by tests using fastify.inject()
- [x] **S03: Example Apps + JSDBC Integration** `risk:low` `depends:[S01,S02]`
  > After this: Two working example applications (Express + Fastify) serve JSDBC-backed REST endpoints, demonstrating the full stack: boot → config → CDI → JSDBC → HTTP — verified by running the apps and hitting endpoints
- [x] **S04: AWS Lambda Adapter** `risk:medium` `depends:[S01]`
  > After this: Same service layer runs serverless on AWS Lambda, CDI boots once on cold start, API Gateway HTTP API v2 events dispatch to controller methods via __routes — proven by direct handler invocation tests + JSDBC integration

## Boundary Map

### S01 → S02

Produces:
- `@alt-javascript/boot-express` adapter package with `expressAutoConfiguration()` function
- Controller convention: static `__routes` metadata on CDI component classes
- `ApplicationContext` instance accessible from route handlers via `req.ctx` or `app.locals.ctx`
- Express server managed as CDI singleton with config-driven port/host and lifecycle hooks

Consumes:
- nothing (first slice)

### S01 → S03

Produces:
- Controller convention (shared between Express and Fastify adapters)
- Pattern for CDI-managed service/repository beans used from HTTP handlers

Consumes:
- nothing (first slice)

### S02 → S03

Produces:
- `@alt-javascript/boot-fastify` adapter package with `fastifyAutoConfiguration()` function
- Fastify instance with CDI context decorated, same controller convention as Express

Consumes:
- Controller convention and service-layer pattern from S01
