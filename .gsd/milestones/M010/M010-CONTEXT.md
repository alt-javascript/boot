# M010 Context — Technical Documentation

**Milestone:** M010
**Status:** Planned

## Goal

Write comprehensive, accurate technical documentation for all modules and examples built in M008 and M009. Documentation lives in the `docs/` directory as Markdown, structured for publication via a static site generator (MkDocs or Docusaurus — TBD).

## Scope

### Modules to document

Each module gets a reference page covering: purpose, installation, key exports, configuration properties, code examples, and integration with `Boot.boot()`.

- `@alt-javascript/config` — config loading, profiles, `EphemeralConfig`, `BrowserProfileResolver`, browser subpath
- `@alt-javascript/logger` — `LoggerFactory`, `CachingLoggerFactory`, log levels, JSON format, browser usage
- `@alt-javascript/cdi` — `ApplicationContext`, `Context`, `Singleton`, `Prototype`, `Value`, `Autowired`, `BeanPostProcessor`, AOP, CDN ESM dist
- `@alt-javascript/boot` — `Boot.boot()`, `Boot-browser.js`, banner, profiles, `run` option, browser entry
- `@alt-javascript/boot-express` — `expressStarter()`, `ExpressAdapter`, route wiring
- `@alt-javascript/boot-fastify` — `fastifyStarter()`, `FastifyAdapter`
- `@alt-javascript/boot-hono` — `honoStarter()`, `HonoAdapter`
- `@alt-javascript/boot-koa` — `koaStarter()`, `KoaAdapter`
- `@alt-javascript/boot-lambda` — `lambdaStarter()`, cold/warm start pattern
- `@alt-javascript/boot-azure-function` — `azureFunctionStarter()`
- `@alt-javascript/boot-cloudflare-worker` — `cloudflareWorkerStarter()`
- `@alt-javascript/boot-vue` — `vueStarter()`, CDN dist, Vite integration
- `@alt-javascript/boot-react` — `reactStarter()`, `CdiProvider`, `useCdi()`, `useBean()` hooks
- `@alt-javascript/boot-angular` — `angularStarter()`, signal-based CDI state
- `@alt-javascript/boot-alpine` — `alpineStarter()`, `bootAlpine()`, placeholder-store pattern
- `@alt-javascript/boot-jsdbc` (M009) — `DataSourceStarter`, `JsdbcTemplateStarter`

### Examples to document

Each example gets a tutorial page: what it shows, how to run it, and the key patterns illustrated.

- All `example-1-*` through `example-5-*` packages from M008 and M009

### Cross-cutting guides

- Getting Started (console → full-stack)
- Profile & Configuration guide
- Dependency Injection guide
- Browser Integration guide (CDN, Vite, no-build)
- Serverless guide (Lambda, Azure, Cloudflare)
- Persistence guide (M009 DataSource + JsdbcTemplate)

## Constraints

- Docs must be validated against running code — no invented API signatures
- Code examples must be copied from (or verified against) the actual example packages
- Human sign-off at each slice
