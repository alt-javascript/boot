# Advanced Features

## AOP (Aspect-Oriented Programming)

Proxy-based method interception with five advice types:

```javascript
import { createProxy, matchMethod } from '@alt-javascript/cdi';

class Calculator {
  add(a, b) { return a + b; }
  multiply(a, b) { return a * b; }
}

const calc = new Calculator();
const proxied = createProxy(calc, [
  {
    pointcut: 'add',                              // exact method name
    before: (args) => console.log('Adding:', args),
    afterReturning: (result) => console.log('Result:', result),
  },
  {
    pointcut: /^multi/,                            // regex match
    around: (proceed, args) => {
      console.log('Before multiply');
      const result = proceed();
      console.log('After multiply');
      return result;
    },
  },
]);
```

### Advice Types

| Advice | Signature | Purpose |
|---|---|---|
| `before` | `(args, methodName, target)` | Run before method |
| `after` | `(result, args, methodName, target)` | Run after method (always) |
| `afterReturning` | `(result, args, methodName, target)` | Run after successful return |
| `afterThrowing` | `(error, args, methodName, target)` | Run after exception |
| `around` | `(proceed, args, methodName, target)` | Wrap entire call |

### Pointcut Patterns

- String: `'add'` — exact name
- Wildcard: `'get*'` — glob pattern
- RegExp: `/^find/` — regex match
- Function: `(name) => name.startsWith('handle')` — predicate

## Auto-Discovery

Classes can self-identify as components using a static `__component` property:

```javascript
class UserService {
  static __component = { scope: 'singleton' };

  constructor() { this.userRepository = null; }
}

class UserRepository {
  static __component = true; // defaults: singleton, name from class
}
```

Scan classes to generate component definitions:

```javascript
import { scan, discover, defaultRegistry } from '@alt-javascript/cdi';

// Scan classes with __component
const defs = scan([UserService, UserRepository]);

// Or use the registry for programmatic registration
defaultRegistry.register(UserService, { scope: 'singleton' });

// discover() = scan + registry drain
const allDefs = discover([UserService, UserRepository]);
```

The `scan()` function reads metadata; it does not scan the filesystem. ESM has no classpath — you pass the class references explicitly.

## Conditional Beans

Register beans only when conditions are met:

```javascript
import {
  conditionalOnProperty,
  conditionalOnMissingBean,
  conditionalOnBean,
  conditionalOnClass,
  conditionalOnProfile,
  allOf,
  anyOf,
  evaluateConditions,
} from '@alt-javascript/cdi';
```

### conditionalOnProfile

Analogous to Spring's `@Profile` annotation:

```javascript
// Active only in production
{
  Reference: ProdDataSource,
  name: 'dataSource',
  condition: conditionalOnProfile('production'),
}

// Active when test profile is NOT active
{
  Reference: RealEmailService,
  name: 'emailService',
  condition: conditionalOnProfile('!test'),
}

// Active when either dev or staging is active
{
  Reference: DebugService,
  name: 'debugService',
  condition: conditionalOnProfile('dev', 'staging'),
}
```

Supports positive profiles, negated profiles (`!name`), and combinations. Multiple positive profiles use OR logic (any match). Multiple negations use AND logic (all must hold).

Profiles are read from `NODE_ACTIVE_PROFILES` environment variable automatically, or passed explicitly to `ApplicationContext`:

```bash
NODE_ACTIVE_PROFILES=production,metrics node app.js
```

### conditionalOnProperty

```javascript
{
  Reference: RedisCache,
  name: 'cache',
  condition: conditionalOnProperty('cache.type', 'redis'),
}
```

### conditionalOnMissingBean

```javascript
{
  Reference: DefaultCache,
  name: 'cache',
  condition: conditionalOnMissingBean('cache'),
}
```

### Composition

```javascript
{
  Reference: ProdService,
  name: 'service',
  condition: allOf(
    conditionalOnProperty('app.env', 'production'),
    conditionalOnBean('database'),
  ),
}
```

### Standalone Filtering

```javascript
const filtered = evaluateConditions(componentDefs, config, existingComponents);
```

## Circular Dependency Detection

Constructor injection cycles are detected and throw a clear error:

```
Error: Circular dependency detected: serviceA → serviceB → serviceA
```

Property-based circular references work fine (like Spring) — both instances exist before wiring, so each gets a reference to the other.
