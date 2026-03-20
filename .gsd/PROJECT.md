# Project

## What This Is

`@alt-javascript` is a Spring-inspired IoC/DI application framework for pure JavaScript. It provides a container, config, logging, database access, and HTTP adapter layer — all as ES modules that run isomorphically in Node.js and as flat ESM in the browser without a build step.

## Core Value

A Spring-style IoC container and application bootstrap in pure JavaScript — no TypeScript required, no build step for browser use, keeping structured DI accessible in the JS ecosystem.

## Current State

17 packages in an npm workspaces monorepo at v3.0.0-alpha.0. 567 tests, 0 failing.

### Core (5 packages)
- `@alt-javascript/common` — shared kernel (global ref, environment detection, `isPlainObject`)
- `@alt-javascript/boot` — application bootstrap, global context setup, `Boot.test()` for test harness
- `@alt-javascript/cdi` — ApplicationContext, component lifecycle, autowiring, AOP, events, conditions, auto-discovery, banner
- `@alt-javascript/config` — hierarchical config with profiles, property sources, YAML/properties/JSON, placeholder resolution, browser profile resolver
- `@alt-javascript/logger` — pluggable logging with category caching, JSON/plaintext formatters

### Database (1 package here, 7 in JSDBC monorepo)
- `@alt-javascript/jsdbc-template` — JsdbcTemplate, NamedParameterJsdbcTemplate, TransactionTemplate, auto-configuration for CDI

### HTTP Adapters (7 packages)
- `@alt-javascript/boot-express` — Express adapter with ControllerRegistrar
- `@alt-javascript/boot-fastify` — Fastify adapter
- `@alt-javascript/boot-koa` — Koa adapter with built-in JSON body parser
- `@alt-javascript/boot-hono` — Hono adapter (Web Standards API)
- `@alt-javascript/boot-lambda` — AWS Lambda adapter (API Gateway HTTP API v2)
- `@alt-javascript/boot-cloudflare-worker` — Cloudflare Workers adapter
- `@alt-javascript/boot-azure-function` — Azure Functions adapter

### Frontend Adapters (4 packages)
- `@alt-javascript/boot-vue` — Vue 3 integration (CDN + CLI, provide/inject bridge)
- `@alt-javascript/boot-alpine` — Alpine.js integration (Alpine.store bridge)
- `@alt-javascript/boot-react` — React integration (Context/hooks: CdiProvider, useCdi, useBean)
- `@alt-javascript/boot-angular` — Angular integration (provider definitions, CdiService)

## Architecture / Key Patterns

- ES modules throughout (`"type": "module"`)
- npm workspaces monorepo — each package independently publishable
- Global state: `Boot.boot()` writes to `global.boot.contexts.root`
- Component metadata: static `__component` property on classes for auto-discovery
- Controller convention: static `__routes` for declarative route metadata
- Profile resolution: `NODE_ACTIVE_PROFILES` (server), `BrowserProfileResolver` URL mapping (browser)
- AOP via JS Proxy — before/after/around/afterReturning/afterThrowing advice
- Application events — isomorphic event bus, typed events, lifecycle events
- Config precedence: overrides → env → profile files → default files → fallback

## Related Repositories

- **JSDBC**: `/Users/craig/src/github/alt-javascript/jsdbc/` — 7 packages (core, sqlite, sqljs, pg, mysql, mssql, oracle). Published to npm.
- **Year Planner**: `/Users/craig/src/alt-html/year-planner/` — Boot 2.x reference app (Vue CDN)

## Milestone Sequence

- [x] M001: Spring Core Gap Analysis & PoC Spikes
- [x] M002: v3.0 Core Implementation (monorepo, BeanPostProcessor, events, auto-discovery, conditions, AOP, constructor injection)
- [x] M003: P2 Features (circular dep detection, dependsOn, primary beans, property source system)
- [x] M004: Documentation (JSDoc, READMEs, MADR decisions, profile conditions)
- [x] M005: JSDBC (research, core + drivers, template, boot integration, auto-configuration)
- [x] M006: Web/MVC Binding (Express, Fastify, Koa, Hono, Lambda, Cloudflare Workers, Azure Functions)
- [x] M007: Frontend Integration (browser profiles, Vue, Alpine, React, Angular)
