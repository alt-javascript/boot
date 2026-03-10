# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run tests
npm test

# Run a single test file
npx mocha --require test/fixtures/index.js test/boot.spec.js

# Lint (auto-fixes)
npm run lint

# Coverage
npm run coverage

# Build browser bundles
npm run build
```

## Architecture

This is an ES module (`"type": "module"`) npm package (`@alt-javascript/boot`) that provides application bootstrap utilities for the `alt-javascript` ecosystem.

### Core modules

- **`Boot.js`** — Static utility class. Detects environment (Node/browser), resolves config from global scope or arguments, sets up `global.boot.contexts.root` with `{config, loggerFactory, loggerCategoryCache, fetch}`. `Boot.test()` uses a `CachingLoggerFactory` to suppress log output during tests.
- **`Application.js`** — Thin async wrapper over `Boot`. Calls `Boot.boot()` then dynamically imports `@alt-javascript/cdi/ApplicationContext` to create a full DI container via `applicationContext.lifeCycle()`.
- **`index.js`** — Named exports: `Application`, `Boot`, `boot`, `root`, `test` (static methods bound from `Boot`), plus re-exports `config` from `@alt-javascript/config`.
- **`index-browser.js`** / **`Boot-browser.js`** / **`Application-browser.js`** — Browser variants bundled by rollup into `dist/`.

### Key dependencies

- `@alt-javascript/config` — provides `ValueResolvingConfig`, `EphemeralConfig`, `ConfigFactory`
- `@alt-javascript/logger` — provides `LoggerFactory`, `CachingLoggerFactory`, `LoggerCategoryCache`
- `@alt-javascript/cdi` — provides `ApplicationContext` (lazy-imported in `Application.run()`)

### Global state pattern

`Boot.boot()` writes to `global.boot.contexts.root` (or `window.boot.contexts.root` in browser). `Boot.detectConfig()` auto-detects config from: explicit argument → global `config` variable → `window.config`. Tests reset this via `global.boot = undefined` after each case.

### Test setup

`test/fixtures/index.js` is the mocha `--require` file. It calls `Boot.test({config})` using the `node-config` package (from `config/` directory), which boots with `CachingLoggerFactory` to suppress noisy log output during test runs.

### Browser bundles

Rollup produces two browser bundles from `dist/`:
- `alt-javascript-boot-esm.js` — ES module bundle (input: `index-browser.js`)
- `alt-javascript-application-iife.js` — IIFE bundle exposing `Application` globally (input: `Application-browser.js`)