# @alt-javascript

[![Language](https://img.shields.io/badge/language-JavaScript-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml/badge.svg)](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml)

A Spring Framework inspired lite IoC / DI application framework for pure JavaScript.

Dependency injection, hierarchical configuration, structured logging, lifecycle management, application events, AOP, profile-based activation, and a CDI middleware pipeline — all in ES modules that run identically in Node.js and the browser, with no TypeScript and no build step required.

## Why

JavaScript has mature DI frameworks, but they require TypeScript decorators (InversifyJS, tsyringe, NestJS) or build tooling. If you want structured dependency injection in a project that stays in pure JavaScript — or if you want the same IoC code to run server-side and in a `<script type="module">` tag — your options are limited.

`@alt-javascript` fills that gap. It brings Spring's proven patterns to the JavaScript ecosystem without requiring a transpiler, bundler, or type system.

## Quick Start

```bash
npm install @alt-javascript/boot @alt-javascript/cdi @alt-javascript/config @alt-javascript/logger
```

```javascript
import { Boot } from '@alt-javascript/boot';
import { ApplicationContext, Context, Singleton } from '@alt-javascript/cdi';
import { EphemeralConfig } from '@alt-javascript/config';

class UserRepository {
  constructor() { this.users = []; }
  add(user) { this.users.push(user); }
  findAll() { return this.users; }
}

class UserService {
  constructor() { this.userRepository = null; } // autowired by name
  createUser(name) { this.userRepository.add({ name }); }
}

const config = new EphemeralConfig({ logging: { level: { ROOT: 'info' } } });
Boot.boot({ config });

const context = new Context([
  new Singleton(UserRepository),
  new Singleton(UserService),
]);

const appCtx = new ApplicationContext({ contexts: [context], config });
await appCtx.start();

const userService = appCtx.get('userService');
userService.createUser('Craig');
console.log(appCtx.get('userRepository').findAll()); // [{ name: 'Craig' }]
```

## Packages

### Core

| Package | Purpose |
|---|---|
| [`@alt-javascript/boot`](packages/boot) | Application bootstrap — environment detection, config resolution, global context, middleware pipeline |
| [`@alt-javascript/cdi`](packages/cdi) | IoC container — components, autowiring, lifecycle, events, AOP, conditions |
| [`@alt-javascript/config`](packages/config) | Hierarchical config — profiles, property sources, `.env` files, placeholder resolution |
| [`@alt-javascript/logger`](packages/logger) | Pluggable logging — config-driven levels, category caching, console/Winston |
| [`@alt-javascript/common`](packages/common) | Shared kernel — environment detection, global reference resolution |

### Database

| Package | Purpose |
|---|---|
| [`@alt-javascript/jsdbc-template`](packages/jsdbc-template) | JsdbcTemplate + NamedParameterJsdbcTemplate — CDI-managed database access |
| [`@alt-javascript/flyway`](packages/flyway) | Flyway-inspired database migrations in JavaScript |
| [`@alt-javascript/boot-flyway`](packages/boot-flyway) | CDI auto-configuration for Flyway migrations |
| [`@alt-javascript/boot-jsdbc`](packages/boot-jsdbc) | CDI auto-configuration for JSDBC data sources |
| [`@alt-javascript/boot-jsnosqlc`](packages/boot-jsnosqlc) | CDI auto-configuration for NoSQL clients |

### HTTP Adapters

All HTTP adapters share the same controller convention (`static __routes`) and the same middleware pipeline (`static __middleware`). Middleware written once works across every adapter.

| Package | Purpose |
|---|---|
| [`@alt-javascript/boot-express`](packages/boot-express) | Express adapter |
| [`@alt-javascript/boot-fastify`](packages/boot-fastify) | Fastify adapter |
| [`@alt-javascript/boot-koa`](packages/boot-koa) | Koa adapter with built-in JSON body parser |
| [`@alt-javascript/boot-hono`](packages/boot-hono) | Hono adapter (Web Standards API — Node.js, Bun, Deno, CF Workers) |
| [`@alt-javascript/boot-lambda`](packages/boot-lambda) | AWS Lambda adapter (API Gateway HTTP API v2) |
| [`@alt-javascript/boot-cloudflare-worker`](packages/boot-cloudflare-worker) | Cloudflare Workers adapter |
| [`@alt-javascript/boot-azure-function`](packages/boot-azure-function) | Azure Functions adapter |

### Frontend Adapters

| Package | Purpose |
|---|---|
| [`@alt-javascript/boot-vue`](packages/boot-vue) | Vue 3 integration — CDI services via provide/inject |
| [`@alt-javascript/boot-alpine`](packages/boot-alpine) | Alpine.js integration — CDI services via Alpine.store |
| [`@alt-javascript/boot-react`](packages/boot-react) | React integration — CdiProvider, useCdi, useBean hooks |
| [`@alt-javascript/boot-angular`](packages/boot-angular) | Angular integration — CDI beans as Angular providers |

## Middleware Pipeline

The middleware pipeline is the CDI equivalent of Spring Security's filter chain or Express middleware. Any CDI component with `static __middleware = { order: N }` participates in the pipeline automatically — lower order runs outermost.

```javascript
// Declare a middleware component — same as any other CDI bean
class AuthMiddleware {
  static __middleware = { order: 5 }; // outermost (runs first in, last out)

  constructor() { this.logger = null; } // autowired

  async handle(request, next) {
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (!token) return { statusCode: 401, body: { error: 'Unauthorized' } };
    return next({ ...request, user: decodeToken(token) });
  }
}

// Register alongside controllers — no other wiring needed
const context = new Context([
  ...expressStarter(),
  new Singleton(AuthMiddleware),   // picked up automatically
  new Singleton(MyController),
]);
```

Three built-in middleware components are registered by every `*Starter()`:

| Component | Order | Behaviour |
|---|---|---|
| `RequestLoggerMiddleware` | 10 | Logs `[METHOD] /path → status (Xms)` via CDI logger |
| `ErrorHandlerMiddleware` | 20 | Converts unhandled exceptions to `{ statusCode, body: { error } }` |
| `NotFoundMiddleware` | 30 | Returns 404 when no route matches |

Disable any built-in via config: `middleware.requestLogger.enabled: false`.

## Design Principles

**Pure JavaScript.** No TypeScript. No decorators. No transpilation. Every source file is a standard ES module that Node.js and browsers execute directly.

**Isomorphic.** The same code runs in Node.js and as `<script type="module">` in the browser.

**Spring-inspired, not Spring-cloned.** The patterns come from Spring. The implementation is idiomatic JavaScript — null-property naming instead of annotations, plain class statics instead of decorator metadata, `NODE_ACTIVE_PROFILES` instead of `spring.profiles.active`.

**Convention over configuration.** Autowiring by name. Profile activation via `NODE_ACTIVE_PROFILES`. Config file discovery follows `application-{profile}.{json,yaml,yml,properties,.env}`.

## Documentation

- **[Getting Started](docs/getting-started.md)** — Build a working app from scratch
- **[Dependency Injection](docs/dependency-injection.md)** — Contexts, components, scopes, autowiring
- **[Configuration](docs/configuration.md)** — Property sources, profiles, environment variables, `.env` files
- **[Lifecycle & Events](docs/lifecycle.md)** — init/start/run/stop/destroy, BeanPostProcessor
- **[Middleware Pipeline](docs/middleware.md)** — Cross-cutting concerns: auth, logging, error handling, 404
- **[Advanced Features](docs/advanced.md)** — AOP, auto-discovery, conditional beans, primary beans
- **[Database Access](docs/database.md)** — JsdbcTemplate, named parameters, auto-configuration
- **[HTTP Adapters](docs/http-adapters.md)** — Express, Fastify, Koa, Hono, Lambda, Cloudflare Workers, Azure Functions
- **[Frontend Integration](docs/frontend-integration.md)** — Vue, Alpine, React, Angular + browser profiles
- **[Browser Usage](docs/browser.md)** — ESM imports, CDN, import maps
- **[Spring Comparison](docs/spring-comparison.md)** — Conceptual migration guide
- **[API Reference](docs/api-reference.md)** — All exports, all packages
- **[Decisions](decisions/)** — Architecture Decision Records

## License

MIT — Copyright (c) 2021–2026 Craig Parravicini

## Spring Framework Attribution

The design of `@alt-javascript` is directly influenced by the [Spring Framework](https://spring.io/projects/spring-framework) and [Spring Boot](https://spring.io/projects/spring-boot).

Specific concepts ported from Spring:

| Spring concept | @alt-javascript equivalent |
|---|---|
| `ApplicationContext` | `@alt-javascript/cdi` `ApplicationContext` |
| `@Component`, `@Service`, `@Repository` | `Singleton`, `Service`, `ComponentRegistry` |
| `@Autowired` (field injection) | Null-property naming convention (`this.service = null`) |
| `@Value("${key:default}")` | Property placeholder strings in component constructors |
| `@PostConstruct` / `@PreDestroy` | `init()` / `destroy()` lifecycle methods |
| `BeanPostProcessor` | `BeanPostProcessor` |
| `ApplicationEvent` / `ApplicationListener` | `ApplicationEvent`, event bus in `ApplicationContext` |
| `@Conditional` / `@ConditionalOnProperty` | `conditionalOnProperty`, `conditionalOnMissingBean` etc. |
| `@EnableAutoConfiguration` / starters | `expressStarter()`, `fastifyStarter()`, etc. |
| `@Aspect` / AOP Alliance | `createProxy()`, `matchMethod()`, advice functions |
| `Environment` / `PropertySource` | `PropertySourceChain`, `EnvPropertySource` |
| `application.properties` / `application.yml` | `ProfileConfigLoader` — same file conventions |
| `spring.profiles.active` | `NODE_ACTIVE_PROFILES` |
| `@Profile` | `conditionalOnProfile()` |
| `JdbcTemplate` / `NamedParameterJdbcTemplate` | `JsdbcTemplate` / `NamedParameterJsdbcTemplate` |
| `Flyway` integration | `@alt-javascript/boot-flyway` / `@alt-javascript/flyway` |
| Spring MVC `@RestController` / `@RequestMapping` | `static __routes` metadata on controller classes |
| Spring Security filter chain | `MiddlewarePipeline` — `static __middleware = { order: N }` |

The Spring Framework is copyright VMware, Inc. / Broadcom. `@alt-javascript` began as an independent re-implementation, 
and subsequent port and is not affiliated with, endorsed by, or associated with VMware, Broadcom, or the Spring team.

> Spring Framework and Spring Boot are trademarks of VMware, Inc. / Broadcom.
> This project is independent and not affiliated with VMware, Broadcom, or the Spring team.
