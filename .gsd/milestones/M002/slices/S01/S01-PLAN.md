# S01: Monorepo Migration + Common Package

**Goal:** Consolidate boot, cdi, config, logger into an npm workspaces monorepo with a shared @alt-javascript/common package. Fix EphemeralConfig falsy bug. All 268 existing tests pass through workspace resolution.
**Demo:** `cd /Users/craig/src/github/alt-javascript/altjs && npm test` runs all tests from all packages through workspace linking, with common module imported instead of inline duplicated code.

## Must-Haves

- New monorepo at `../altjs/` with npm workspaces
- `@alt-javascript/common` package with `getGlobalRef`, `detectBrowser`, `getGlobalRoot`, `isPlainObject`
- All four packages import from `@alt-javascript/common` instead of inline copies
- EphemeralConfig falsy-value bug fixed (false/0/"" no longer treated as missing)
- All 268 existing tests pass (74 boot + 38 cdi + 40 config + 116 logger)
- Version bumps to 3.0.0-alpha.0

## Proof Level

- This slice proves: integration
- Real runtime required: yes — workspace cross-package imports must resolve
- Human/UAT required: no

## Verification

- `cd ../altjs && npm test` — all 268+ tests pass
- `cd ../altjs && node -e "import('@alt-javascript/common').then(m => console.log(Object.keys(m)))"` — common module exports resolve
- EphemeralConfig test added for `config.get('path.to.false')` returning `false` (not throwing)

## Tasks

- [x] **T01: Create monorepo scaffold and copy source** `est:1h`
  - Why: Foundation — new repo with workspaces config, all source copied in
  - Files: `../altjs/package.json`, `../altjs/packages/*/package.json`
  - Do: (1) Create `../altjs/` directory. (2) Create root package.json with `"workspaces": ["packages/*"]`. (3) Copy source files from boot, cdi, config, logger into `packages/boot/`, `packages/cdi/`, `packages/config/`, `packages/logger/`. Exclude node_modules, dist, .git, coverage, poc, .gsd. (4) Create `packages/common/` with common module from PoC. (5) Update each package.json: set version to `3.0.0-alpha.0`, replace npm @alt-javascript/* dependencies with `"workspace:*"` or `"3.0.0-alpha.0"`. (6) `npm install` at root. (7) `git init && git add . && git commit`.
  - Verify: `cd ../altjs && npm install` succeeds; workspace linking resolves; `ls packages/` shows 5 dirs
  - Done when: monorepo exists with all 5 packages, npm install succeeds

- [x] **T02: Replace duplicated global-ref code with common imports** `est:45m`
  - Why: Core deduplication — the primary reason for the common package
  - Files: `packages/boot/Boot.js`, `packages/boot/Boot-browser.js`, `packages/cdi/ApplicationContext.js`, `packages/config/ConfigFactory.js`, `packages/config/browser/ConfigFactory.js`, `packages/logger/LoggerFactory.js`, `packages/config/DelegatingConfig.js`, `packages/logger/JSONFormatter.js`
  - Do: (1) In each file that defines getGlobalRef/detectBrowser/getGlobalRoot inline, replace with `import { getGlobalRef, detectBrowser, getGlobalRoot } from '@alt-javascript/common'`. Remove the inline function definitions. (2) In DelegatingConfig.js and JSONFormatter.js, replace inline isPlainObject with import from common. (3) Handle browser variants — browser files may need browser-specific common import path.
  - Verify: `npm test` in each package passes with the new imports
  - Done when: No inline copies of getGlobalRef/detectBrowser/getGlobalRoot/isPlainObject remain in any package

- [x] **T03: Fix EphemeralConfig falsy-value bug and run full test suite** `est:30m`
  - Why: Known bug from M001 — false/0/"" values treated as missing
  - Files: `packages/config/EphemeralConfig.js`, `packages/config/test/EphemeralConfig.spec.js`
  - Do: (1) In EphemeralConfig.get(), change `if (root)` to `if (root !== null && root !== undefined)`. (2) Add tests for falsy values: `config.get('path.to.false')` returns `false`, `config.get('path.to.zero')` returns `0`, `config.get('path.to.empty')` returns `""`. (3) Run full test suite across all packages.
  - Verify: `npm test` at monorepo root — all 268+ tests pass (including new EphemeralConfig tests)
  - Done when: Full suite green, EphemeralConfig correctly returns falsy values

## Files Likely Touched

- `../altjs/package.json` — monorepo root
- `../altjs/packages/common/` — new shared kernel package
- `../altjs/packages/boot/` — migrated from `../boot/`
- `../altjs/packages/cdi/` — migrated from `../cdi/`
- `../altjs/packages/config/` — migrated from `../config/`
- `../altjs/packages/logger/` — migrated from `../logger/`
