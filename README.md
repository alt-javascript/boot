# @alt-javascript

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

| Package | Purpose |
|---|---|
| [`@alt-javascript/boot`](packages/boot) | Application bootstrap — detects environment, resolves config, initialises global context |
| [`@alt-javascript/cdi`](packages/cdi) | IoC container — component definitions, autowiring, lifecycle, events, AOP, conditions |
| [`@alt-javascript/config`](packages/config) | Hierarchical configuration — profiles, property sources, placeholder resolution, env binding |
| [`@alt-javascript/logger`](packages/logger) | Pluggable logging — config-driven levels, category caching, console/Winston/multi backends |
| [`@alt-javascript/common`](packages/common) | Shared kernel — environment detection, global reference resolution |

## Documentation

- **[Getting Started](docs/getting-started.md)** — Tutorial: build a working app from scratch
- **[Dependency Injection](docs/dependency-injection.md)** — Contexts, components, scopes, autowiring, constructor injection
- **[Configuration](docs/configuration.md)** — Property sources, profiles, .properties format, environment variables
- **[Lifecycle & Events](docs/lifecycle.md)** — init/start/run/stop/destroy, application events, BeanPostProcessor
- **[Advanced Features](docs/advanced.md)** — AOP, auto-discovery, conditional beans, primary beans, dependsOn
- **[Browser Usage](docs/browser.md)** — ESM imports, CDN, import maps
- **[Spring Comparison](docs/spring-comparison.md)** — What's similar, what's different, conceptual migration guide
- **[API Reference](docs/api-reference.md)** — All exports, all packages
- **[Decisions](decisions/)** — Architecture Decision Records (MADR format)

## Design Principles

**Pure JavaScript.** No TypeScript. No decorators. No transpilation. Every source file is a standard ES module that Node.js and browsers execute directly. This is an ideological choice — see [ADR-002](decisions/002-pure-javascript.md).

**Isomorphic.** The same code runs in Node.js and as `<script type="module">` in the browser. No polyfills, no bundler, no conditional compilation. Browser builds are flat ESM bundles importable via CDN.

**Spring-inspired, not Spring-cloned.** The patterns (IoC, DI, lifecycle, events, AOP, profiles, externalized config) come from Spring. The implementation is idiomatic JavaScript where it can be, idiosyncratic where it must be. See the [Spring Comparison](docs/spring-comparison.md) for the full mapping.

**Convention over configuration.** Autowiring matches null properties to component names. Profile activation via `NODE_ACTIVE_PROFILES`. Config file discovery follows `application-{profile}.{json,yaml,properties}` convention.

## License

MIT
