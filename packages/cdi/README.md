# @alt-javascript/cdi

[![Language](https://img.shields.io/badge/language-JavaScript-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![npm version](https://img.shields.io/npm/v/%40alt-javascript%2Fcdi)](https://www.npmjs.com/package/@alt-javascript/cdi)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml/badge.svg)](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml)

IoC container and dependency injection for the `@alt-javascript` framework. Provides component definitions, autowiring, lifecycle management, application events, AOP, and conditional beans — all in pure JavaScript ES modules.

**The design is a direct port of the [Spring Framework](https://spring.io/projects/spring-framework)'s `ApplicationContext` and component model to idiomatic JavaScript.**

**Part of the [@alt-javascript](https://github.com/alt-javascript/boot) monorepo.**

## Install

```bash
npm install @alt-javascript/cdi
```

## Quick Start

```javascript
import { ApplicationContext, Context, Singleton } from '@alt-javascript/cdi';
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

appCtx.get('userService').createUser('Craig');
console.log(appCtx.get('userRepository').findAll()); // [{ name: 'Craig' }]
```

## Component Definition

### Class-based (recommended)

```javascript
import { Singleton, Service, Property } from '@alt-javascript/cdi/context/index.js';

// Null-property naming → autowired by name (equivalent to Spring @Autowired)
class OrderService {
  constructor() {
    this.orderRepository = null;  // autowired
    this.emailService = null;     // autowired
    this.logger = null;           // autowired

    // Property injection — resolved from config (equivalent to Spring @Value)
    this.maxRetries = '${order.maxRetries:3}';
    this.currency   = '${app.currency:USD}';
  }

  init() { /* called after wiring — @PostConstruct equivalent */ }
  destroy() { /* called on shutdown — @PreDestroy equivalent */ }
}
```

### Object literal

```javascript
const context = new Context([
  {
    name: 'myService',
    Reference: MyService,
    scope: 'singleton',
    condition: (config, components) => config.has('feature.enabled'),
  },
]);
```

## Lifecycle

The `ApplicationContext` lifecycle mirrors Spring's `refresh()` → `start()` → `stop()` sequence:

| Phase | Method | Spring equivalent |
|---|---|---|
| Wire + init | `appCtx.prepare()` | `refresh()` |
| Run | `appCtx.run()` | `start()` |
| Both | `appCtx.start()` | `run()` (SpringApplication) |
| Shutdown | `appCtx.stop()` | `close()` |

## Conditional Beans

```javascript
import {
  conditionalOnProperty,
  conditionalOnMissingBean,
  conditionalOnProfile,
  allOf,
} from '@alt-javascript/cdi';

// Register only when config property is set to 'true'
const context = new Context([{
  name: 'cacheService',
  Reference: RedisCache,
  condition: conditionalOnProperty('cache.enabled'),
}]);
```

## AOP

```javascript
import { createProxy, matchMethod } from '@alt-javascript/cdi';

const proxy = createProxy(myService, {
  before: (ctx) => console.log(`Calling ${ctx.method}`),
  after:  (ctx) => console.log(`Done ${ctx.method} → ${ctx.result}`),
  around: (ctx) => { /* intercept */ return ctx.proceed(); },
  throws: (ctx) => console.error(`Error in ${ctx.method}`, ctx.error),
}, matchMethod(/^find/));
```

## Application Events

```javascript
import { ApplicationEvent, ApplicationEventPublisher } from '@alt-javascript/cdi';

class OrderCreatedEvent extends ApplicationEvent {
  constructor(order) { super('order.created'); this.order = order; }
}

class OrderListener {
  onApplicationEvent(event) {
    if (event.type === 'order.created') {
      this.emailService.send(event.order.customer, 'Your order is confirmed');
    }
  }
}
```

## Spring Attribution

| Spring concept | @alt-javascript/cdi equivalent |
|---|---|
| `@Component`, `@Service`, `@Repository` | `Singleton`, `Service` |
| `@Autowired` (field injection) | Null-property naming convention |
| `@Value("${key:default}")` | Placeholder strings in constructor |
| `@PostConstruct` | `init()` method |
| `@PreDestroy` | `destroy()` method |
| `ApplicationContext.refresh()` | `appCtx.prepare()` |
| `ApplicationContext.start()` | `appCtx.run()` |
| `ApplicationEvent` / `ApplicationListener` | `ApplicationEvent` + event bus |
| `@Conditional` / `@ConditionalOnProperty` | `conditionalOnProperty()` etc. |
| `BeanPostProcessor` | `BeanPostProcessor` |
| `@Aspect` (Spring AOP) | `createProxy()` |

## License

MIT
