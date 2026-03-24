# M008 Summary — Framework Ergonomics & Example Suite

**Status:** Complete (S14/S15 deferred to M009)
**Commits:** S01 through S13 + renames, lodash removal, CDI dist fixes

## What was built

14 example packages across every supported deployment target, each with:
- Full CDI wiring, profile-aware config, and structured logging
- Unit tests (mocha or Vitest) with 5+ assertions
- Human UAT sign-off

| Package | Target | Highlights |
|---|---|---|
| `example-1-{1..5}-intro-*` | Console | Config, logger, CDI, profiles, full boot |
| `example-2-1-servers-express` | Express | REST, middleware, CDI controllers |
| `example-2-2-servers-fastify` | Fastify | `FastifyAdapter`, idempotent destroy |
| `example-2-3-servers-hono` | Hono | `@hono/node-server`, CDI controllers |
| `example-2-4-servers-koa` | Koa | `KoaAdapter`, CDI middleware |
| `example-3-1-serverless-lambda` | AWS Lambda | cold/warm start, PlantUML docs |
| `example-3-2-serverless-azure-function` | Azure Functions v4 | `azureFunctionStarter()` |
| `example-3-3-serverless-cloudflare-worker` | Cloudflare Worker | Web Standards Response |
| `example-4-1-frontend-vue-cdn` | Vue CDN no-build | HTML-first, importmap |
| `example-4-2-frontend-vue-vite` | Vue + Vite | Vitest, browser aliases, `config/browser/` |
| `example-4-3-frontend-react` | React + Vite | `reactStarter()`, module-level CDI singleton |
| `example-4-4-frontend-angular` | Angular + Vite | `angularStarter()`, signal-based reactive state |
| `example-4-5-frontend-alpine` | Alpine.js CDN | `alpineStarter()`, placeholder-store pattern |

## Key framework improvements shipped

- **`*Starter` rename**: all `*AutoConfiguration` → `*Starter` (deprecated aliases kept)
- **`exports` conditions**: `browser` / `node` split in `config`, `logger`, `cdi`, `boot`
- **`Boot-browser.js` auto profile resolution**: POJO config with `profiles.urls` → automatic `BrowserProfileResolver` wiring
- **`const` → `let` bug**: fixed in `boot-vue/index.js`
- **Vite dynamic import warning**: suppressed via `/* @vite-ignore */`
- **lodash removed**: fully replaced with native JS equivalents in `@alt-javascript/cdi`
- **CDI dist browser fixes**: broken `config`/`loggerFactory` singleton imports fixed
- **Alpine placeholder-store pattern**: `{ ready: false }` registered during `alpine:init`; mutated in-place after async boot; Alpine reactivity handles re-render
- **`destroy()` idempotency**: guard added to `FastifyAdapter`

## Deferred

- **S14 Advanced Features** → M009 (persistence + advanced features milestone)
- **S15 programming-altjs Skill** → M009

## Test status at close

21 mocha suites + 5 Vitest (Vue Vite) + 5 Vitest (React) + 5 Vitest (Angular) = all green (~540+ tests)
Last commit: `de1caf6`
