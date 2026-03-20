# Spring Comparison

A guide for developers coming from Spring Framework / Spring Boot. This maps Spring concepts to their `@alt-javascript` equivalents, notes what's similar, what's different, and where the framework makes deliberately different choices.

## Core Concept Mapping

| Spring | @alt-javascript | Notes |
|---|---|---|
| `ApplicationContext` | `ApplicationContext` | Same name, similar lifecycle. JS version is async (`await appCtx.start()`) |
| `@Component` / `@Service` | `new Singleton(MyClass)` or `static __component` | No annotations — use helper classes or static metadata |
| `@Autowired` (field) | `null` property matching | Property name matches component name → injected |
| `@Autowired` (constructor) | `constructorArgs: ['beanName']` | String args resolved from context |
| `@Value("${path}")` | `Property` + placeholder resolution | `new Property({ config: 'db.host' })` |
| `@Profile` | `profiles: ['dev']` on component def, or `conditionalOnProfile('dev')` | Same concept, two syntaxes |
| `@Primary` | `primary: true` on component def | Same behavior |
| `@DependsOn` | `dependsOn: ['beanName']` | Topological sort, same semantics |
| `@Conditional` | `condition: conditionalOnProperty(...)` | Function-based, composable with `allOf`/`anyOf` |
| `BeanPostProcessor` | `BeanPostProcessor` class | Same interface, same lifecycle hooks |
| `ApplicationEvent` | `ApplicationEvent` class | Same pattern, isomorphic (no EventEmitter) |
| `@EventListener` | `onApplicationEvent()` method | Convention-based detection, not annotation |
| AOP (`@Aspect`, `@Around`) | `createProxy(target, aspects)` | JS Proxy, same advice types |
| `application.properties` | `.properties` file support | Same format, same dot-notation and array syntax |
| `application.yml` | YAML file support | Requires js-yaml |
| `SPRING_PROFILES_ACTIVE` | `NODE_ACTIVE_PROFILES` | Same mechanism, different env var name |
| `Environment` | `PropertySourceChain` | Layered property sources with precedence |
| `@ConfigurationProperties` | Not implemented | No type binding — use Property definitions or config.get() |
| Classpath scanning | Not applicable | ESM has no classpath. Pass class arrays to `scan()` |
| Prototype scope | `new Prototype(MyClass)` | Same behavior — new instance per get() |
| Singleton scope | `new Singleton(MyClass)` | Same behavior — one instance per context |
| `@PostConstruct` | `init()` method | Convention, not annotation |
| `@PreDestroy` | `destroy()` method | Convention, not annotation |
| `SmartLifecycle` | `start()` / `stop()` methods | Simpler — no `isRunning()` or `getPhase()` |
| `DisposableBean` | `destroy()` method | Convention-based |
| `InitializingBean` | `init()` method | Convention-based |
| `Aware` interfaces | `setApplicationContext(ctx)` | Only ApplicationContextAware equivalent |
| `JdbcTemplate` | `JsdbcTemplate` | Async. `query` → `queryForList`. See [Database Access](database.md) |
| `NamedParameterJdbcTemplate` | `NamedParameterJsdbcTemplate` | Same `:param` syntax |
| `DataSource` auto-config | `jsdbcAutoConfiguration()` | Reads `jsdbc.*` config properties |
| Spring MVC `@Controller` | Controller with `static __routes` | Declarative route metadata. See [HTTP Adapters](http-adapters.md) |
| `@GetMapping` / `@PostMapping` | `{ method: 'get', path: '/todos', handler: 'list' }` | Objects in `__routes` array |
| Spring MVC `@RequestBody` | `req.body` | Normalised request object in handler |
| Spring MVC `@PathVariable` | `req.params` | Normalised request object in handler |

## What's Similar

**IoC Container Lifecycle.** The prepare → initialize → post-process → event flow maps closely to Spring's refresh cycle. BeanPostProcessor, events, and lifecycle callbacks work the same way conceptually.

**Property Injection.** null-property autowiring is analogous to `@Autowired` field injection. The container matches by name (not type — JavaScript has no static types).

**Externalized Configuration.** Profile-based file loading (`application-{profile}.json`), environment variable binding, and layered precedence follow Spring Boot's model directly. The `.properties` file parser handles the same format including array notation.

**Conditional Registration.** `conditionalOnProperty`, `conditionalOnMissingBean`, `conditionalOnBean` map directly to Spring Boot's `@ConditionalOn*` annotations.

## What's Different

### No Annotations

JavaScript has no annotation equivalent. Stage 3 decorators exist but aren't in engines yet. The framework uses:

- **Constructor classes** (`new Singleton(MyClass)`) instead of `@Component`
- **Static metadata** (`static __component = {...}`) instead of `@Component`
- **Convention methods** (`init()`, `destroy()`, `onApplicationEvent()`) instead of `@PostConstruct`, `@PreDestroy`, `@EventListener`
- **Plain objects** (`{ condition: conditionalOnProperty(...) }`) instead of `@Conditional`

This is a deliberate choice — see [ADR-005](../decisions/005-no-decorators.md).

### Name-Based Wiring (Not Type-Based)

Spring resolves autowiring by type. JavaScript has no static type system, so `@alt-javascript` wires by name:

```javascript
class OrderService {
  constructor() {
    this.orderRepository = null; // injected if 'orderRepository' exists in context
  }
}
```

The property name *is* the qualifier. There's no equivalent of `@Qualifier` because the name already serves that purpose.

### No Classpath Scanning

Spring scans the classpath to discover `@Component` classes. ESM has no classpath — modules are loaded by explicit import. Auto-discovery requires passing class arrays:

```javascript
const defs = scan([UserService, UserRepository, OrderService]);
```

This is a fundamental platform constraint, not a design choice.

### No Type Coercion

Spring Boot coerces configuration values to Java types (`"8080"` → `int 8080`). JavaScript's dynamic typing means config values retain their source type. JSON values get JS types naturally. `.properties` files always produce strings.

### Isomorphic by Design

Spring is server-only. `@alt-javascript` runs identically in Node.js and browser ESM. This constrains some choices:

- Event system uses a custom pub/sub (not Node EventEmitter)
- Global state goes through `getGlobalRef()` (not `global` directly)
- No filesystem scanning (browsers have no filesystem)

### No Spring Boot Auto-Configuration

Spring Boot auto-configures hundreds of beans based on classpath detection. `@alt-javascript` provides the primitives (`conditionalOnProperty`, `conditionalOnMissingBean`) but no pre-built auto-configuration. You wire your own beans.

## Migrating Conceptually

If you're a Spring developer starting with `@alt-javascript`:

1. **Your mental model transfers.** IoC, DI, lifecycle, events, AOP — the concepts are the same. The syntax changes.

2. **Replace annotations with definitions.** Where you'd write `@Service public class Foo`, write `new Singleton(Foo)` or add `static __component = true` to the class.

3. **Replace `@Autowired` with null properties.** Initialize injectable fields to `null` in the constructor.

4. **Replace `application.properties` as-is.** The same file format works. Set `NODE_ACTIVE_PROFILES` instead of `SPRING_PROFILES_ACTIVE`.

5. **Use `init()` for `@PostConstruct`.** No annotation needed — the container calls it automatically.

6. **Think in names, not types.** Your property names are your qualifiers. Name them to match the component they should receive.
