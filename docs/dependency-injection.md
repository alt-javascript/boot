# Dependency Injection

## Contexts and Components

The ApplicationContext manages a collection of component definitions. Components are defined using helper classes that set the scope:

```javascript
import { Context, Singleton, Prototype, Service } from '@alt-javascript/cdi';

const context = new Context([
  new Singleton(MyService),        // one shared instance
  new Prototype(RequestHandler),   // new instance per get()
  new Service(UserRepository),     // alias for Singleton (semantic)
]);
```

Or as plain objects for full control:

```javascript
const context = new Context([
  {
    Reference: MyService,
    name: 'myService',
    scope: 'singleton',
    constructorArgs: ['dependency1'],
    dependsOn: ['otherBean'],
    primary: true,
  },
]);
```

## Scopes

| Scope | Behavior | Helper Class |
|---|---|---|
| `singleton` | One instance per context, shared | `Singleton`, `Service` |
| `prototype` | New instance on every `get()` call | `Prototype`, `Transient` |

## Autowiring

### Implicit (Property-Based)

The container inspects each singleton's instance properties after creation. Any property that is `null` and matches a registered component name gets injected:

```javascript
class OrderService {
  constructor() {
    this.orderRepository = null;  // matched to 'orderRepository' component
    this.emailService = null;     // matched to 'emailService' component
    this.internalState = [];      // not null → not autowired
  }
}
```

This is the primary wiring mechanism — Spring developers will recognise it as analogous to `@Autowired` on fields.

### Explicit (Marker String)

Set a property to `'Autowired'` to force autowiring even if the value isn't null:

```javascript
class MyComponent {
  constructor() {
    this.service = 'Autowired'; // explicitly request injection
  }
}
```

### Constructor Injection

Pass dependencies via constructor arguments by name:

```javascript
{
  Reference: OrderService,
  name: 'orderService',
  constructorArgs: ['orderRepository', 'emailService'],
}
```

String arguments that match component names are resolved from the context. Non-matching strings and other types are passed through as-is. Circular constructor dependencies are detected and throw a clear error.

## Config Property Injection

Bind config values to component properties using the Property helper:

```javascript
import { Property } from '@alt-javascript/cdi';

class DatabaseConnection {
  constructor() {
    this.host = null;
    this.port = null;
  }
}

const context = new Context([
  new Singleton(DatabaseConnection),
  new Property({ name: 'databaseConnection', property: 'host', config: 'db.host' }),
  new Property({ name: 'databaseConnection', property: 'port', config: 'db.port', value: 5432 }),
]);
```

The `config` field is a dot-notation path into the config object. The `value` field provides a fallback.

## Profiles

Activate components only for specific runtime profiles:

```javascript
const context = new Context([
  { Reference: MockEmailService, name: 'emailService', profiles: ['test'] },
  { Reference: SmtpEmailService, name: 'emailService', profiles: ['production'] },
]);

const appCtx = new ApplicationContext({
  contexts: [context],
  config,
  profiles: ['production'],
});
```

## Primary Beans

When multiple components share the same name, mark one as `primary: true` to win:

```javascript
new Context([
  { Reference: DefaultCache, name: 'cache' },
  { Reference: RedisCache, name: 'cache', primary: true }, // wins
]);
```

Two primaries with the same name still throw. Two non-primaries with the same name still throw.

## DependsOn

Control initialization order explicitly:

```javascript
new Context([
  { Reference: CacheWarmer, name: 'cacheWarmer', dependsOn: ['cache', 'database'] },
  { Reference: Cache, name: 'cache' },
  { Reference: Database, name: 'database' },
]);
```

The container uses topological sort (Kahn's algorithm) to initialize singletons in dependency order. Circular `dependsOn` is detected and throws.
