# M006: Web / MVC Binding — Framework Integration with Express and Fastify

**Gathered:** 2026-03-21
**Status:** Ready for planning

## Project Description

Research and implement adapter packages that bind the `@alt-javascript` boot/CDI container into idiomatic JavaScript HTTP frameworks (Express, Fastify), enabling developers to use framework-managed services, config, logging, AOP, and lifecycle while preserving the native ergonomics of each HTTP library.

## Why This Milestone

JavaScript backend developers building with Express or Fastify face two recurring problems:

1. **No standardised cross-cutting concerns.** Security, logging, config, and transaction management are handled by bespoke middleware/plugins per framework with no portability between them.
2. **Poor layer separation.** The ergonomics of Express/Fastify encourage mixing application logic directly into route handlers, creating tight coupling between business logic and HTTP transport.

The alt-javascript ecosystem already solves these problems in its CDI container (config, logging, DI, AOP, events, lifecycle), and 2.x demos prove the basic wiring works. But the current approach is minimal — a hand-coded `Server` class per project. There's no reusable adapter layer, no convention for controller registration, and no mechanism for translating CDI cross-cutting concerns (AOP, events) into the middleware/plugin space of the target framework.

**Spring parallel.** Early Spring injected itself into servlet containers via `DispatcherServlet`. Spring Boot inverted this — the container becomes a managed dependency. In JavaScript, the inversion already exists: Express/Fastify are just npm packages, not runtime containers. The question isn't "how do we inject into the container" but "how do we complement the framework's existing ergonomics without getting in the way."

## User-Visible Outcome

### When this milestone is complete, the user can:

- Boot an Express or Fastify application with CDI-managed services, config, and logging via a one-line adapter registration
- Define controllers as CDI components that auto-register routes at startup
- Use framework-native middleware/plugins for cross-cutting concerns while having those concerns' configuration flow from the CDI container
- Switch an application's HTTP layer from Express to Fastify (or vice versa) without rewriting service/repository classes

### Entry point / environment

- Entry point: `Application.run()` or `new ApplicationContext().start()`
- Environment: Node.js backend (local dev, Docker, CI)
- Live dependencies involved: Express or Fastify (npm packages)

## Completion Class

- Contract complete means: adapter tests prove CDI beans are resolvable from route handlers, controllers auto-register, config/logging flow correctly, lifecycle (startup/shutdown) is wired
- Integration complete means: a working hello-world app using each adapter, with a service layer that is identical between Express and Fastify versions
- Operational complete means: graceful shutdown, destroy hooks, and error propagation work end-to-end

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- An Express app boots via `Application.run()`, serves HTTP with CDI-managed service/repository/template beans, and shuts down cleanly
- A Fastify app does the same, with an identical service layer (only the adapter and route registration differ)
- A JSDBC-backed service (JsdbcTemplate from the CDI auto-config) serves data through both adapters without modification

## Risks and Unknowns

- **Ergonomic tension** — Adding DI/IoC to Express/Fastify may feel unnatural to developers who prefer the minimalism of those frameworks. The adapter must complement, not compete with, native patterns.
- **Middleware vs AOP overlap** — Both frameworks have their own middleware/plugin systems for cross-cutting concerns. Unclear whether AOP proxies should integrate with those systems or stay purely at the service layer.
- **Controller registration design** — No established JS convention for declarative route-to-method mapping (Java uses `@RequestMapping`). Need to find a JS-idiomatic equivalent.
- **Fastify encapsulation model** — Fastify plugins have encapsulated scopes. The CDI container operates on a flat singleton model. May need a bridge for Fastify's DI expectations.
- **Request-scoped beans** — Express/Fastify handlers are per-request. CDI currently has singleton and prototype scopes. May need a request scope concept for things like per-request transaction context.

## Existing Codebase / Prior Art

- `boot-demo-express-hello-world/` — 2.x Express integration: Server class as CDI singleton, `app` as prototype factory, config-driven port, lifecycle hooks
- `boot-demo-fastify-hello-world/` — 2.x Fastify integration: same pattern, fastify instance as prototype factory
- `alt-html/year-planner/` — Browser-side boot integration (relevant for isomorphic patterns, deferred to M007)
- `packages/cdi/ApplicationContext.js` — Singleton/prototype lifecycle, dependsOn, BeanPostProcessor, events, AOP
- `packages/jsdbc-template/JsdbcAutoConfiguration.js` — Auto-configuration pattern: `jsdbcAutoConfiguration()` returns conditional component defs
- `packages/cdi/Aop.js` — `createProxy()` with before/after/around/afterReturning/afterThrowing advice

## Relevant Requirements

- R001 — IoC/DI (extend to HTTP framework integration)
- R008 — Integration proof across real subsystems

## Scope

### In Scope

- `@alt-javascript/boot-express` adapter package
- `@alt-javascript/boot-fastify` adapter package
- Convention for controller-as-CDI-component with route auto-registration
- Config-driven server properties (port, host, etc.)
- Graceful startup/shutdown lifecycle integration
- CDI-managed services accessible from route handlers
- Working examples for each adapter
- Auto-configuration functions (like `jsdbcAutoConfiguration()`) for each adapter

### Out of Scope / Non-Goals

- Full MVC framework (template rendering, view resolution, content negotiation)
- Security middleware implementation (will be a separate milestone)
- WebSocket support
- GraphQL integration
- Frontend framework bindings (Vue, Ember — deferred to M007)
- NestJS-style decorators or opinionated structure enforcement
- HTTP client / RestTemplate equivalent
- Replacing or wrapping Express/Fastify APIs — the developer uses them directly

## Technical Constraints

- Pure JavaScript ESM — no TypeScript
- Must not require a build step
- Controller/route metadata without native decorators (Stage 3 not in engines)
- Adapter must not patch or monkey-patch the framework's internals
- Must work with Express 4.x/5.x and Fastify 5.x

## Integration Points

- `@alt-javascript/cdi` — ApplicationContext provides the DI container
- `@alt-javascript/config` — Externalised config drives server properties
- `@alt-javascript/logger` — Logging integration (bridge Fastify pino or Express morgan)
- `@alt-javascript/jsdbc-template` — Proves the pattern: CDI-managed data access behind HTTP routes
- Express / Fastify — npm packages, used as-is

## Open Questions

- **Controller pattern**: Static metadata (`__routes`) vs registry-based (`registry.route('GET', '/users', 'userController', 'list')`) vs config-driven? Need to prototype and evaluate ergonomics.
- **Request context propagation**: How to make the ApplicationContext (and its beans) available inside route handlers? Options: `req.ctx`, decorator on the app instance, closure capture, Fastify's `decorate`.
- **Logging bridge**: Should alt-javascript/logger replace pino/morgan, or should they coexist with a bridge? Coexistence is probably more pragmatic.
- **Auto-configuration granularity**: One big `expressAutoConfiguration()` or composable pieces (`expressServer()`, `expressControllers()`, `expressLogging()`)?
- **Test strategy**: How to test adapters without starting real HTTP servers? Supertest for Express, `fastify.inject()` for Fastify — both support in-process request injection.
