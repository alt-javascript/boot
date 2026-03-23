# M008: Framework Ergonomics & Example Suite

**Vision:** Every supported deployment target has a working `example-*` package that serves as
the canonical reference for idiomatic `@alt-javascript` usage — minimal boilerplate, correct
config/profile/logging setup, and a human UAT sign-off before the next slice begins.

## Success Criteria

- `npm start` in each `packages/example-*/` runs without errors
- Config loading (file-based + profile override) verified in each example
- Logging works in both text and JSON format, level controlled by config
- DI wiring demonstrated in each example (at least one autowired dependency)
- No unnecessary boilerplate in any entry point
- Every slice has a UAT checklist signed off by the user before the next slice starts
- A `programming-altjs` GSD skill encodes the conventions from the completed examples

## Key Risks / Unknowns

- Cloudflare Worker and AWS Lambda environments cannot run locally without tooling (Wrangler,
  SAM) — UAT for those slices requires the tooling to be present or the examples to be
  verifiable by inspection + unit test
- No-build web app (S09) depends on CDN URLs being live — local-only fallback may be needed
  for UAT if CDN is unavailable
- Angular CLI scaffolding may require Node version alignment — worth checking early

## Proof Strategy

- Lambda/Cloudflare runtime constraints → retire in S06/S08 by using local emulation (SAM
  local / Wrangler dev) or, if unavailable, unit-testing the handler directly
- No-build CDN dependency → retire in S09 by including a local `node_modules` import-map
  fallback alongside the CDN version

## Verification Classes

- **Runnable**: `npm start` exits cleanly (or serves without error for web examples)
- **Config**: default config loads; a profile override changes at least one value
- **Logging**: log line appears in expected format (text or JSON) at the expected level
- **DI**: a service with an autowired dependency returns correct output
- **UAT**: human sign-off in `S{nn}-UAT.md` with all checkboxes checked

## Milestone Definition of Done

All 14 example packages run correctly, UAT sign-off exists for each slice, and the
`programming-altjs` skill is committed and tested against at least one example.

## Requirement Coverage

- Ergonomics and convention-over-configuration across all deployment targets
- Human-in-the-loop verification at each increment

## Slices

- [x] **S01: Console Application** `risk:low` `depends:[]`
- [x] **S02: Express** `risk:low` `depends:[S01]`
- [x] **S03: Fastify** `risk:low` `depends:[S01]`
- [x] **S04: Hono** `risk:low` `depends:[S01]`
- [x] **S05: Koa** `risk:low` `depends:[S01]`
- [x] **S06: AWS Lambda** `risk:medium` `depends:[S01]`
- [x] **S07: Azure Function** `risk:medium` `depends:[S01]`
- [ ] **S08: Cloudflare Worker** `risk:medium` `depends:[S01]`
- [ ] **S09: No-Build Web App (Vue CDN)** `risk:medium` `depends:[S01]`
- [ ] **S10: Vue (Vite)** `risk:low` `depends:[S09]`
- [ ] **S11: React** `risk:low` `depends:[S09]`
- [ ] **S12: Angular** `risk:medium` `depends:[S09]`
- [ ] **S13: Alpine.js** `risk:low` `depends:[S09]`
- [ ] **S14: Advanced Features** `risk:medium` `depends:[S01,S02]`
- [ ] **S15: programming-altjs Skill** `risk:low` `depends:[S14]`

## Boundary Map

### S01 → all subsequent slices

Produces:
- `packages/example-console-app/` — canonical pattern for config loading, profile setup,
  logging configuration (text + JSON), and DI wiring
- `packages/example-console-app/config/` — reference config directory structure
- Slice UAT template (`S{nn}-UAT.md`) that all subsequent slices reuse

Consumes:
- nothing (first slice)

### S09 → S10, S11, S12, S13

Produces:
- `packages/example-no-build-web/` — canonical CDN import map, `Boot.boot()` pattern,
  `EphemeralConfig` + `BrowserProfileResolver` setup for browser
- Reference HTML structure all browser examples adapt

Consumes:
- S01 pattern for config and DI

### S14 → S15

Produces:
- `packages/example-advanced/` — AOP, BeanPostProcessor, events, conditional beans,
  constructor injection all demonstrated in one runnable example

Consumes:
- S01 pattern as the base; extends it with advanced features
