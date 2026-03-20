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

---

## @alt-javascript/jsdbc-template

```javascript
import {
  JsdbcTemplate,
  NamedParameterJsdbcTemplate,
  TransactionTemplate,
  ConfiguredDataSource,
  jsdbcAutoConfiguration,
} from '@alt-javascript/jsdbc-template';
```

| Export | Description |
|---|---|
| `JsdbcTemplate(dataSource)` | SQL operations: `execute`, `update`, `queryForList`, `queryForObject`, `queryForMap`, `batchUpdate`, `executeInTransaction` |
| `NamedParameterJsdbcTemplate(dataSource)` | Named `:param` parameters. Same methods as JsdbcTemplate. |
| `TransactionTemplate(dataSource)` | Callback-based transaction management |
| `ConfiguredDataSource` | CDI-aware DataSource that reads `jsdbc.*` config |
| `jsdbcAutoConfiguration()` | Returns CDI component definitions for DataSource + templates |

---

## @alt-javascript/config (Browser)

```javascript
import { BrowserProfileResolver, ProfileAwareConfig } from '@alt-javascript/config';
```

| Export | Description |
|---|---|
| `BrowserProfileResolver.resolve(options)` | Resolve active profiles from URL. Options: `{ urlMappings, locationHref, queryParam }` |
| `new ProfileAwareConfig(configObject, activeProfiles)` | Config wrapper that overlays profile-specific sections onto base config |

---

## HTTP Adapter Packages

All adapters share the controller convention: static `__routes` metadata + normalised `{ params, query, headers, body, ctx }` request.

### @alt-javascript/boot-express

```javascript
import { expressAutoConfiguration, ExpressAdapter, ControllerRegistrar } from '@alt-javascript/boot-express';
```

| Export | Description |
|---|---|
| `expressAutoConfiguration()` | CDI component definitions for Express adapter |
| `ExpressAdapter` | Creates Express app, registers routes, starts listening |
| `ControllerRegistrar` | Scans CDI beans for `__routes` and binds to Express router |

### @alt-javascript/boot-fastify

```javascript
import { fastifyAutoConfiguration, FastifyAdapter } from '@alt-javascript/boot-fastify';
```

### @alt-javascript/boot-koa

```javascript
import { koaAutoConfiguration, KoaAdapter, KoaControllerRegistrar } from '@alt-javascript/boot-koa';
```

### @alt-javascript/boot-hono

```javascript
import { honoAutoConfiguration, HonoAdapter, HonoControllerRegistrar } from '@alt-javascript/boot-hono';
```

### @alt-javascript/boot-lambda

```javascript
import { createLambdaHandler, lambdaAutoConfiguration, LambdaControllerRegistrar } from '@alt-javascript/boot-lambda';
```

| Export | Description |
|---|---|
| `createLambdaHandler(options)` | Standalone handler function. Boots CDI on cold start, reuses on warm. |
| `lambdaAutoConfiguration()` | CDI component definitions for Lambda adapter |
| `LambdaControllerRegistrar` | Scans routes, auto-converts `:param` → `{param}` |

### @alt-javascript/boot-cloudflare-worker

```javascript
import { createWorkerHandler, cloudflareWorkerAutoConfiguration } from '@alt-javascript/boot-cloudflare-worker';
```

| Export | Description |
|---|---|
| `createWorkerHandler(options)` | Returns a `fetch(request, env, ctx)` handler |
| `cloudflareWorkerAutoConfiguration()` | CDI component definitions |

### @alt-javascript/boot-azure-function

```javascript
import { createAzureFunctionHandler, azureFunctionAutoConfiguration } from '@alt-javascript/boot-azure-function';
```

| Export | Description |
|---|---|
| `createAzureFunctionHandler(options)` | Returns a handler producing `{ status, jsonBody, headers }` |
| `azureFunctionAutoConfiguration()` | CDI component definitions |

---

## Frontend Adapter Packages

### @alt-javascript/boot-vue

```javascript
import { createCdiApp, cdiPlugin, getBean } from '@alt-javascript/boot-vue';
```

| Export | Description |
|---|---|
| `createCdiApp(options)` | Boot CDI + create Vue app. Options: `{ contexts, config, rootComponent, createApp, onReady }` |
| `cdiPlugin` | Vue plugin: `app.use(cdiPlugin, { contexts, config })` |
| `getBean(ctx, name)` | Resolve a CDI bean outside Vue's inject system |

### @alt-javascript/boot-alpine

```javascript
import { bootAlpine } from '@alt-javascript/boot-alpine';
```

| Export | Description |
|---|---|
| `bootAlpine(options)` | Boot CDI + register as Alpine store. Options: `{ contexts, config, Alpine, storeName }` |

### @alt-javascript/boot-react

```javascript
import { bootCdi, bootCdiHeadless } from '@alt-javascript/boot-react';
```

| Export | Description |
|---|---|
| `bootCdi(options)` | Returns `{ CdiProvider, useCdi, useBean, getBean, applicationContext }`. Options: `{ contexts, config, React }` |
| `bootCdiHeadless(options)` | Returns booted `ApplicationContext` without React |

### @alt-javascript/boot-angular

```javascript
import { createCdiProviders, createCdiProvidersWithService, CdiService } from '@alt-javascript/boot-angular';
```

| Export | Description |
|---|---|
| `createCdiProviders(options)` | Returns `{ applicationContext, providers }` — Angular `{ provide, useValue }[]` |
| `createCdiProvidersWithService(options)` | Same + adds a `CdiService` provider for dynamic lookup |
| `CdiService` | `getBean(name)` + `applicationContext` accessor |
