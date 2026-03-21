# M008 Context — Framework Ergonomics & Example Suite

## Goal

Prove and document the ergonomics of `@alt-javascript` across every supported deployment
target by building a suite of working `example-*` packages. Each example is the canonical
reference for its environment — the code that shows what idiomatic usage actually looks like.

## What "Good Ergonomics" Means Here

- Minimal boilerplate in `main.js` / entry point — no ceremony beyond what's meaningful
- Convention over configuration: config loading, profiles, and logging work with zero setup
  if the developer follows naming conventions
- No unexpected surprises when switching between `EphemeralConfig`, `ProfileAwareConfig`,
  and file-based config (`config/default.json`)
- Logging works out of the box: both text and JSON format; log level controlled by config
- The example code itself is the test — if it runs correctly end-to-end, the framework works

## Deployment Targets (one slice each)

| Slice | Package | Example module |
|---|---|---|
| S01 | (Node core) | `example-console-app` |
| S02 | `boot-express` | `example-express` |
| S03 | `boot-fastify` | `example-fastify` |
| S04 | `boot-hono` | `example-hono` |
| S05 | `boot-koa` | `example-koa` |
| S06 | `boot-lambda` | `example-lambda` |
| S07 | `boot-azure-function` | `example-azure-function` |
| S08 | `boot-cloudflare-worker` | `example-cloudflare-worker` |
| S09 | `boot-vue` (no-build CDN) | `example-no-build-web` |
| S10 | `boot-vue` (Vite) | `example-vue` |
| S11 | `boot-react` | `example-react` |
| S12 | `boot-angular` | `example-angular` |
| S13 | `boot-alpine` | `example-alpine` |
| S14 | (advanced features) | `example-advanced` |
| S15 | (skill) | `programming-altjs` skill |

## What Each Example Must Demonstrate

Every example (S01–S14) covers the same checklist:

1. **Config loading** — `EphemeralConfig` for the simplest case, `config/default.json` for
   file-based, `ProfileAwareConfig` / `BrowserProfileResolver` where applicable
2. **Profiles** — at least two profiles (`default` + one env-specific), showing value override
3. **Logging setup** — text format by default; JSON format via config; log level by category
4. **DI wiring** — at least one service with an autowired dependency
5. **No unnecessary boilerplate** — entry point should be minimal; framework handles the rest
6. **Boot.boot() called correctly** — config passed through; global root populated

## UAT Gate (Human in the Loop)

Each slice ends with a `UAT` step that I (the user) must sign off before the next slice begins.
The UAT checklist is in `S{nn}-UAT.md` for each slice and contains:

- [ ] Example runs without errors
- [ ] Config loading verified (default + profile override)
- [ ] Logging output verified (text and JSON)
- [ ] DI wiring verified (expected service behaviour)
- [ ] Code is minimal — no unnecessary boilerplate
- [ ] Feedback notes (free text)

Auto-mode **must not** proceed to the next slice until the UAT file shows all checkboxes
checked and a human sign-off line.

## S14 — Advanced Features Example

`example-advanced` demonstrates:
- AOP (method interception)
- `BeanPostProcessor`
- Application events
- Conditional beans (`conditionalOnProfile`, `conditionalOnProperty`)
- Constructor injection

## S15 — `programming-altjs` Skill

A GSD skill that encodes the conventions, patterns, and guard rails derived from the
example suite. The skill activates when writing code against `@alt-javascript` and
keeps generated code on the rails: correct `Boot.boot()` usage, correct config patterns,
correct wiring conventions, correct test fixtures.

## Constraints

- Each `example-*` module lives in `packages/example-*/` — a proper npm workspace member
- Examples use the monorepo's local packages (workspace deps, not npm registry)
- Each example is runnable with `npm start` from its own directory
- No build step for the no-build web example (S09)
- Browser examples (S09–S13) can be served with `npx serve .`

## Out of Scope

- Performance benchmarks
- Production hardening of the examples (they are demos, not production starters)
- Documentation site changes (covered by M007)
