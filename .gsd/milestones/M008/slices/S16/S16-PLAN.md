---
slice: S16
milestone: M008
status: ready
---

# S16 Plan — Browser-Safe Package Split

## Objective

Add `package.json` `exports` conditions to `config`, `logger`, `cdi`, and `boot` so
bundlers (Vite, webpack 5, Rollup) automatically resolve browser-safe entry points.
Eliminate all vite.config.js aliases from S10. Leave CDN dist and server-side
examples unchanged.

## Tasks

- [ ] **T01: Audit subpath imports across workspace** `est:30min`
  Grep all `@alt-javascript/*` imports that use a subpath (not bare specifier).
  List every subpath that must appear in the `exports` map to avoid breakage.
  Output: a list of required subpath entries per package.

- [ ] **T02: Add `exports` map to `config`** `est:1h`
  - Add `"."` entry with `"browser": "./browser/index.js"` and `"default": "./index.js"`
  - Add subpath entries for all used subpaths (from T01)
  - Verify `browser/index.js` exports everything needed (PropertySourceChain etc.)
  - Run `npm test` from workspace root — all suites pass

- [ ] **T03: Add `exports` map to `logger`** `est:20min`
  - Add `"."` entry with `"default": "./index.js"` (logger is browser-safe once config is fixed)
  - Add subpath entries if needed (T01)
  - Run `npm test`

- [ ] **T04: Add `exports` map to `cdi`** `est:20min`
  - Add `"."` entry with `"default": "./index.js"`
  - Add subpath entries: `"./context/index.js"` and others found in T01
  - Run `npm test`

- [ ] **T05: Add `exports` map to `boot`** `est:30min`
  - Add `"."` entry with `"browser": "./index-browser.js"` and `"default": "./index.js"`
  - Verify `Boot-browser.js` is the canonical browser implementation (it is)
  - Run `npm test`

- [ ] **T06: Remove aliases from S10 vite.config.js** `est:20min`
  - Delete all `resolve.alias` entries
  - Delete `jasypt-browser-stub.js`
  - Run `npm run dev` in S10 and verify both localhost:5173 and 127.0.0.1:5173 load correctly
  - Run `npm test` (Vitest) in S10 — 5/5 passing

- [ ] **T07: Verify rollup dist builds** `est:20min`
  - Rebuild `boot` dist: `npm run build` in `packages/boot`
  - Rebuild `boot-vue` dist: `npm run build` in `packages/boot-vue`
  - Verify S09 CDN server still works at localhost:3000/dev and 127.0.0.1:3000/dev
  - Check no regressions in dist exports

- [ ] **T08: Full regression pass** `est:15min`
  - `npm test` from workspace root — all 20 mocha suites pass
  - `npm test` in S10 — 5 Vitest tests pass
  - Commit

## Definition of Done

- All 20 mocha suites pass
- S10 Vitest 5/5 pass
- S10 Vite dev server renders with correct profile badges, no console warnings
  about `fs`, `crypto`, `path`, or `module`
- S09 CDN server unchanged and working
- `vite.config.js` in S10 contains no `resolve.alias` entries
- `jasypt-browser-stub.js` deleted
