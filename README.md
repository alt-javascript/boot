# @alt-javascript

[![Language](https://img.shields.io/badge/language-JavaScript-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml/badge.svg)](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml)

A Spring-inspired IoC / DI application framework for pure JavaScript.

Dependency injection, hierarchical configuration, structured logging, lifecycle management, events, AOP — all in ES modules that run identically in Node.js and the browser, with no TypeScript and no build step required.

## Why

JavaScript has mature DI frameworks, but they require TypeScript decorators (InversifyJS, tsyringe, NestJS) or build tooling. If you want structured dependency injection in a project that stays in pure JavaScript — or if you want the same IoC code to run server-side and in a `<script type="module">` tag — your options are limited.

`@alt-javascript` fills that gap. It brings Spring's proven patterns (IoC container, property injection, constructor injection, component lifecycle, application events, AOP, profile-based activation, externalized configuration) to the JavaScript ecosystem without requiring a transpiler, bundler, or type system.

## Quick Start

```bash
npm install @alt-javascript/boot @alt-javascript/cdi @alt-javascript/config @alt-javascript/logger
```

```javascript
import { Boot } from '@alt-javascript/boot';
import { ApplicationContext, Context, Singleton } from '@alt-javascript/cdi';
import { EphemeralConfig } from '@alt-javascript/config';

// Define your components
class UserRepository {
  constructor() { this.users = []; }
  add(user) { this.users.push(user); }
  findAll() { return this.users; }
}

class UserService {
  constructor() { this.userRepository = null; } // autowired by name
  createUser(name) { this.userRepository.add({ name }); }
}

// Wire them up
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
| [`@alt-javascript/boot`](packages/boot) | Application bootstrap — environment detection, config resolution, global context |
| [`@alt-javascript/cdi`](packages/cdi) | IoC container — components, autowiring, lifecycle, events, AOP, conditions |
| [`@alt-javascript/config`](packages/config) | Hierarchical config — profiles, property sources, placeholder resolution |
| [`@alt-javascript/logger`](packages/logger) | Pluggable logging — config-driven levels, category caching, console/Winston |
| [`@alt-javascript/common`](packages/common) | Shared kernel — environment detection, global reference resolution |

### Database

| Package | Purpose |
|---|---|
| [`@alt-javascript/jsdbc-template`](packages/jsdbc-template) | JsdbcTemplate + NamedParameterJsdbcTemplate — CDI-managed database access |

### HTTP Adapters

| Package | Purpose |
|---|---|
| [`@alt-javascript/boot-express`](packages/boot-express) | Express adapter with ControllerRegistrar |
| [`@alt-javascript/boot-fastify`](packages/boot-fastify) | Fastify adapter |
| [`@alt-javascript/boot-koa`](packages/boot-koa) | Koa adapter with built-in JSON body parser |
| [`@alt-javascript/boot-hono`](packages/boot-hono) | Hono adapter (Web Standards API) |
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

## Documentation

- **[Getting Started](docs/getting-started.md)** — Build a working app from scratch
- **[Dependency Injection](docs/dependency-injection.md)** — Contexts, components, scopes, autowiring
- **[Configuration](docs/configuration.md)** — Property sources, profiles, environment variables
- **[Lifecycle & Events](docs/lifecycle.md)** — init/start/run/stop/destroy, BeanPostProcessor
- **[Advanced Features](docs/advanced.md)** — AOP, auto-discovery, conditional beans, primary beans
- **[Browser Usage](docs/browser.md)** — ESM imports, CDN, import maps
- **[Spring Comparison](docs/spring-comparison.md)** — Conceptual migration guide
- **[API Reference](docs/api-reference.md)** — All exports, all packages
- **[Decisions](decisions/)** — Architecture Decision Records (MADR format)

## Design Principles

**Pure JavaScript.** No TypeScript. No decorators. No transpilation. Every source file is a standard ES module that Node.js and browsers execute directly.

**Isomorphic.** The same code runs in Node.js and as `<script type="module">` in the browser. No polyfills, no bundler, no conditional compilation.

**Spring-inspired, not Spring-cloned.** The patterns come from Spring. The implementation is idiomatic JavaScript.

**Convention over configuration.** Autowiring by name. Profile activation via `NODE_ACTIVE_PROFILES`. Config file discovery follows `application-{profile}.{json,yaml,properties}`.

## License

MIT — Copyright (c) 2021-2026 Craig Parravicini
