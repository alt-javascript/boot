# @alt-javascript/cdi

IoC container and dependency injection for the `@alt-javascript` framework. Provides component definitions, autowiring, constructor injection, lifecycle management, application events, AOP, conditional beans, and auto-discovery — all in pure JavaScript ES modules.

**Part of the [@alt-javascript](https://github.com/nickg-alt/altjs) monorepo.**

## Install

```bash
npm install @alt-javascript/cdi
```

## Quick Start

```javascript
import { ApplicationContext, Context, Singleton, Service, Property } from '@alt-javascript/cdi';
import { Boot } from '@alt-javascript/boot';
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

const svc = appCtx.get('userService');
svc.createUser('Craig');
```

## Scopes

| Helper | Scope | Behaviour |
|---|---|---|
| `Singleton(Class)` | singleton | One shared instance |
| `Service(Class)` | singleton | Semantic alias for Singleton |
| `Prototype(Class)` | prototype | New instance per `get()` call |
| `Transient(Class)` | prototype | Alias for Prototype |

## Autowiring

Properties initialised to `null` in the constructor are matched to registered component names and injected automatically:

```javascript
class OrderService {
  constructor() {
    this.orderRepository = null;  // → injected from context
    this.emailService = null;     // → injected from context
  }
}
```

### Constructor Injection

```javascript
{ Reference: OrderService, name: 'orderService', constructorArgs: ['orderRepository', 'emailService'] }
```

## Config Property Injection

```javascript
new Property({ name: 'myService', property: 'port', config: 'server.port', value: 8080 })
```

## Lifecycle

Components can implement any combination of:

| Method | Phase | Purpose |
|---|---|---|
| `setApplicationContext(ctx)` | init | Receive context reference |
| `init()` | init | Post-injection setup |
| `start()` | run | Start services |
| `run()` | run | Execute main logic |
| `stop()` | shutdown | Stop services |
| `destroy()` | shutdown | Cleanup |

## Profiles

```javascript
{ Reference: MockService, name: 'emailService', profiles: ['test'] }
{ Reference: SmtpService, name: 'emailService', profiles: ['production'] }
```

## Primary Beans

```javascript
{ Reference: RedisCache, name: 'cache', primary: true }
```

## DependsOn

```javascript
{ Reference: CacheWarmer, name: 'cacheWarmer', dependsOn: ['cache', 'database'] }
```

Topological sort ensures correct initialisation order.

## Application Events

```javascript
import { ApplicationEvent, ContextRefreshedEvent, ContextClosedEvent } from '@alt-javascript/cdi';

class MyListener {
  onApplicationEvent(event) {
    if (event instanceof ContextRefreshedEvent) {
      console.log('Context ready');
    }
  }
}
```

## AOP

```javascript
import { createProxy } from '@alt-javascript/cdi';

const proxied = createProxy(target, [
  { pointcut: 'save', before: (args) => console.log('saving...') },
]);
```

Advice types: `before`, `after`, `afterReturning`, `afterThrowing`, `around`.

## Auto-Discovery

```javascript
import { scan, discover } from '@alt-javascript/cdi';

class MyService {
  static __component = { scope: 'singleton' };
}

const defs = scan([MyService]);
```

## Conditional Beans

```javascript
import { conditionalOnProperty, conditionalOnMissingBean, allOf } from '@alt-javascript/cdi';

{
  Reference: RedisCache,
  name: 'cache',
  condition: conditionalOnProperty('cache.type', 'redis'),
}
```

## BeanPostProcessor

```javascript
import { BeanPostProcessor } from '@alt-javascript/cdi';

class AuditProcessor extends BeanPostProcessor {
  postProcessAfterInitialization(instance, name) {
    console.log(`Initialized: ${name}`);
    return instance;
  }
}
```

## Browser

A pre-built ESM bundle is available at `dist/alt-javascript-cdi-esm.js` for browser use via `<script type="module">` or import maps.

## License

MIT
