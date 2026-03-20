# Changelog

## 3.0.0 — 2026-03-18

Complete rewrite as a monorepo with 17 packages. Breaking changes from v2.x.

### New packages

- `@alt-javascript/common` — shared kernel (global ref, environment detection)
- `@alt-javascript/jsdbc-template` — JsdbcTemplate, NamedParameterJsdbcTemplate, auto-configuration
- `@alt-javascript/boot-express` — Express adapter with ControllerRegistrar
- `@alt-javascript/boot-fastify` — Fastify adapter
- `@alt-javascript/boot-koa` — Koa adapter
- `@alt-javascript/boot-hono` — Hono adapter (Web Standards API)
- `@alt-javascript/boot-lambda` — AWS Lambda adapter (API Gateway HTTP API v2)
- `@alt-javascript/boot-cloudflare-worker` — Cloudflare Workers adapter
- `@alt-javascript/boot-azure-function` — Azure Functions adapter
- `@alt-javascript/boot-vue` — Vue 3 CDI integration
- `@alt-javascript/boot-alpine` — Alpine.js CDI integration
- `@alt-javascript/boot-react` — React CDI integration (Context/hooks)
- `@alt-javascript/boot-angular` — Angular CDI integration (providers)

### Core enhancements

- **Auto-discovery**: static `__component` class property for self-registering components
- **AOP**: before/after/around/afterReturning/afterThrowing advice via JS Proxy
- **Application events**: typed event bus with `ContextRefreshedEvent`, `ContextClosedEvent`
- **BeanPostProcessor**: intercept bean creation for cross-cutting concerns
- **Conditional registration**: `conditionalOnProperty`, `conditionalOnClass`, `conditionalOnMissingBean`, `conditionalOnProfile`
- **Constructor injection**: `__inject` static property specifies constructor dependencies
- **Circular dependency detection**: fails fast with clear error message and dependency chain
- **`dependsOn`**: explicit ordering of bean initialization
- **Primary beans**: `primary: true` resolves ambiguous autowiring
- **Profile-aware config**: Spring Boot-aligned file loading with `NODE_ACTIVE_PROFILES`
- **Property source chain**: layered precedence (overrides → env → profile files → defaults → fallback)
- **YAML and .properties support**: `application.yaml`, `application.properties` alongside JSON
- **Startup banner**: configurable banner printed during ApplicationContext startup
- **Browser profiles**: `BrowserProfileResolver` — declarative URL-to-profile mapping for browser apps
- **`ProfileAwareConfig`**: profile-specific config overlays for browser environments

### Breaking changes

- Monorepo structure — install individual `@alt-javascript/*` packages
- `@alt-javascript/common` extracts shared utilities previously duplicated across packages
- `Boot.boot()` global context shape updated
- Config `WindowLocationSelectiveConfig` replaced by `BrowserProfileResolver` + `ProfileAwareConfig`
