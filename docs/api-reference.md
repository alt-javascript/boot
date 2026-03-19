# API Reference

## @alt-javascript/cdi

### ApplicationContext

```javascript
import { ApplicationContext } from '@alt-javascript/cdi';
```

| Method | Description |
|---|---|
| `new ApplicationContext(options)` | Create context. Options: `{ contexts, profiles, name, config, configContextPath }` |
| `await start(options?)` | Full lifecycle (prepare + run). `{ run: false }` skips run phase |
| `get(name, defaultValue?, targetArgs?)` | Retrieve component instance by name |

### Component Definitions

```javascript
import { Context, Singleton, Prototype, Service, Transient, Component, Property } from '@alt-javascript/cdi';
```

| Class | Scope | Description |
|---|---|---|
| `Singleton(ClassOrOptions)` | singleton | One shared instance |
| `Service(ClassOrOptions)` | singleton | Semantic alias |
| `Prototype(ClassOrOptions)` | prototype | New instance per get() |
| `Transient(ClassOrOptions)` | prototype | Alias for Prototype |
| `Component(options)` | configurable | Full control |
| `Property(options)` | — | Config value binding |
| `Context(components)` | — | Collection of definitions |

### Events

```javascript
import {
  ApplicationEvent,
  ApplicationEventPublisher,
  ContextRefreshedEvent,
  ContextClosedEvent,
} from '@alt-javascript/cdi';
```

| Class | Description |
|---|---|
| `ApplicationEvent` | Base event class (source, timestamp) |
| `ApplicationEventPublisher` | Pub/sub hub, auto-registered as 'applicationEventPublisher' |
| `ContextRefreshedEvent` | Published after context initialization |
| `ContextClosedEvent` | Published during shutdown |

### AOP

```javascript
import { createProxy, matchMethod } from '@alt-javascript/cdi';
```

| Function | Description |
|---|---|
| `createProxy(target, aspects)` | Wrap object with Proxy-based interception |
| `matchMethod(name, pattern)` | Test method name against pattern (string, regex, function) |

### Auto-Discovery

```javascript
import { scan, discover, defaultRegistry, ComponentRegistry, COMPONENT_META_KEY } from '@alt-javascript/cdi';
```

| Export | Description |
|---|---|
| `scan(classes)` | Read `static __component` metadata from class array |
| `discover(classes?)` | scan() + drain defaultRegistry |
| `defaultRegistry` | Singleton ComponentRegistry instance |
| `ComponentRegistry` | Programmatic registration (register, drain, clear) |
| `COMPONENT_META_KEY` | `'__component'` constant |

### Conditions

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

| Function | Description |
|---|---|
| `conditionalOnProperty(path, value?, matchIfMissing?)` | Config property check |
| `conditionalOnProfile(...profiles)` | Active profile check (supports `!negation`) |
| `conditionalOnMissingBean(name)` | Bean not registered |
| `conditionalOnBean(name)` | Bean is registered |
| `conditionalOnClass(classRef)` | Class available |
| `allOf(...conditions)` | AND composition |
| `anyOf(...conditions)` | OR composition |
| `evaluateConditions(defs, config, components?, profiles?)` | Filter definitions |

### BeanPostProcessor

```javascript
import { BeanPostProcessor } from '@alt-javascript/cdi';
```

Extend and override:
- `postProcessBeforeInitialization(instance, name)` → return instance
- `postProcessAfterInitialization(instance, name)` → return instance

---

## @alt-javascript/config

```javascript
import {
  EphemeralConfig,
  ConfigFactory,
  ProfileConfigLoader,
  PropertySourceChain,
  EnvPropertySource,
  PropertiesParser,
  ValueResolvingConfig,
  DelegatingConfig,
  // Resolver chain
  DelegatingResolver,
  PlaceHolderResolver,
  SelectiveResolver,
  URLResolver,
  // Selectors
  PlaceHolderSelector,
  PrefixSelector,
  ParenthesisSelector,
  Selector,
  // Other
  JasyptDecryptor,
  Resolver,
  config,  // auto-created singleton
} from '@alt-javascript/config';
```

| Class | Description |
|---|---|
| `EphemeralConfig(object)` | In-memory config from plain object |
| `ProfileConfigLoader.load(options?)` | Spring-aligned profile config loader |
| `PropertySourceChain(sources?)` | Layered config with precedence |
| `EnvPropertySource(env?)` | process.env with relaxed binding |
| `PropertiesParser.parse(text)` | Java .properties → JS object |
| `ConfigFactory.getConfig()` | Traditional (node-config backed) |
| `ConfigFactory.loadConfig(options?)` | Spring-aligned config loading |
| `ValueResolvingConfig(config, resolver)` | Placeholder/encryption resolution |

---

## @alt-javascript/boot

```javascript
import { Boot, Application, boot, root, test, config } from '@alt-javascript/boot';
```

| Export | Description |
|---|---|
| `Boot.boot(context?)` | Bootstrap application, populate global context |
| `Boot.test(context?)` | Test bootstrap with CachingLoggerFactory |
| `Boot.root(name, default?)` | Read from global boot context |
| `Application.run(options)` | Boot + create ApplicationContext + lifecycle |

---

## @alt-javascript/logger

```javascript
import {
  LoggerFactory,
  CachingLoggerFactory,
  LoggerCategoryCache,
  ConfigurableLogger,
  ConsoleLogger,
  DelegatingLogger,
  MultiLogger,
  WinstonLogger,
  WinstonLoggerFactory,
  Logger,
  LoggerLevel,
  JSONFormatter,
  PlainTextFormatter,
  CachingConsole,
} from '@alt-javascript/logger';
```

| Class | Description |
|---|---|
| `LoggerFactory.getLogger(category, config?)` | Create/retrieve a logger |
| `CachingLoggerFactory` | Logger factory for tests (captures output) |
| `ConfigurableLogger` | Reads level from config path |
| `ConsoleLogger` | Writes to console |
| `MultiLogger` | Fans out to multiple loggers |
| `WinstonLogger` | Winston backend |

Logger levels: `debug`, `verbose`, `info`, `warn`, `error`, `fatal`

---

## @alt-javascript/common

```javascript
import { detectBrowser, getGlobalRef, getGlobalRoot, isPlainObject } from '@alt-javascript/common';
```

| Function | Description |
|---|---|
| `detectBrowser()` | Returns `true` if running in browser |
| `getGlobalRef()` | Returns `window` or `globalThis` |
| `getGlobalRoot(key)` | Read from `boot.contexts.root[key]` |
| `isPlainObject(value)` | Check if value is a plain object |
