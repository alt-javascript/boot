# S01: Monorepo Migration + Common Package

**Goal:** Consolidate boot, cdi, config, logger into an npm workspaces monorepo with a shared @alt-javascript/common package. Fix EphemeralConfig falsy bug. All 268 existing tests pass through workspace resolution.
**Demo:** After this: all 268 existing tests pass through npm workspaces with shared @alt-javascript/common; EphemeralConfig falsy bug fixed

## Tasks
- [x] **T01: Create monorepo scaffold and copy source** — 
  - Files: ../altjs/package.json, ../altjs/packages/*/package.json
  - Verify: `cd ../altjs && npm install` succeeds; workspace linking resolves; `ls packages/` shows 5 dirs
- [x] **T02: Replace duplicated global-ref code with common imports** — 
  - Files: packages/boot/Boot.js, packages/boot/Boot-browser.js, packages/cdi/ApplicationContext.js, packages/config/ConfigFactory.js, packages/config/browser/ConfigFactory.js, packages/logger/LoggerFactory.js, packages/config/DelegatingConfig.js, packages/logger/JSONFormatter.js
  - Verify: `npm test` in each package passes with the new imports
- [x] **T03: Fix EphemeralConfig falsy-value bug and run full test suite** — 
  - Files: packages/config/EphemeralConfig.js, packages/config/test/EphemeralConfig.spec.js
  - Verify: `npm test` at monorepo root — all 268+ tests pass (including new EphemeralConfig tests)
