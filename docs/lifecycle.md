# Lifecycle & Events

## Component Lifecycle

The ApplicationContext manages component lifecycle through a series of phases:

```
parseContexts
  → registerEventPublisher
  → createSingletons          // constructors called, constructorArgs resolved
  → injectSingletonDependencies  // property autowiring + explicit wiring
  → detectBeanPostProcessors
  → postProcessBeforeInitialization
  → detectEventListeners
  → initialiseSingletons      // setApplicationContext() + init(), respecting dependsOn order
  → postProcessAfterInitialization
  → registerSingletonDestroyers
  → publishContextRefreshedEvent
run phase:
  → start()                   // lifecycle interface
  → run()                     // run methods
shutdown:
  → stop()                    // lifecycle interface
  → destroy()                 // cleanup
  → publishContextClosedEvent
```

### Lifecycle Methods

| Method | When Called | Purpose |
|---|---|---|
| `constructor()` | createSingletons | Instance creation |
| `setApplicationContext(ctx)` | initialiseSingletons (before init) | Aware interface — receive context reference |
| `init()` | initialiseSingletons | Post-injection initialization |
| `start()` | run phase | Start services (open connections, begin listening) |
| `run()` | run phase | Execute main logic |
| `stop()` | shutdown | Stop services (close connections) |
| `destroy()` | shutdown | Final cleanup |

All are optional. Implement only what you need.

### Custom Init/Destroy Method Names

```javascript
{
  Reference: MyService,
  name: 'myService',
  init: 'setup',      // calls instance.setup() instead of instance.init()
  destroy: 'cleanup', // calls instance.cleanup() instead of instance.destroy()
}
```

## Application Events

The event system provides decoupled communication between components. No dependency on Node's EventEmitter — works in browser ESM.

### Built-In Events

| Event | When Published |
|---|---|
| `ContextRefreshedEvent` | After all singletons are initialized and post-processed |
| `ContextClosedEvent` | During shutdown, before destroyers run |

### Listening to Events

Implement `onApplicationEvent(event)` on any singleton:

```javascript
class StartupListener {
  onApplicationEvent(event) {
    if (event.constructor.name === 'ContextRefreshedEvent') {
      console.log('Application context is ready');
    }
  }
}
```

The container detects this method automatically — no registration needed.

### Publishing Custom Events

```javascript
import { ApplicationEvent } from '@alt-javascript/cdi';

class OrderCreatedEvent extends ApplicationEvent {
  constructor(source, order) {
    super(source);
    this.order = order;
  }
}

// In a component with access to the context:
class OrderService {
  constructor() {
    this.applicationEventPublisher = null; // autowired
  }

  createOrder(data) {
    const order = { ...data, id: Date.now() };
    this.applicationEventPublisher.publishEvent(new OrderCreatedEvent(this, order));
    return order;
  }
}
```

## BeanPostProcessor

Intercept bean creation for cross-cutting concerns:

```javascript
import { BeanPostProcessor } from '@alt-javascript/cdi';

class LoggingPostProcessor extends BeanPostProcessor {
  postProcessAfterInitialization(instance, name) {
    console.log(`Bean initialized: ${name}`);
    return instance;
  }
}

const context = new Context([
  new Singleton(LoggingPostProcessor),
  // ... other beans
]);
```

Post-processors are detected automatically. Both methods receive the instance and bean name, and must return the instance (or a replacement).

### Aware Interface

Components that implement `setApplicationContext(ctx)` receive a reference to the ApplicationContext before `init()` is called:

```javascript
class ContextAwareService {
  setApplicationContext(ctx) {
    this.ctx = ctx;
  }

  init() {
    // ctx is available here
    const config = this.ctx.get('config');
  }
}
```
