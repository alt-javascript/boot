# S03: Spring-Aligned Property Source System

**Goal:** New `PropertySourceConfig` implementation following Spring's externalized configuration model — profile-aware file loading (JSON/YAML/properties), `process.env` injection, layered precedence, and `NODE_ACTIVE_PROFILES` to select profile-specific config files.
**Demo:** `application.json` provides defaults, `application-dev.json` overrides for dev profile, `process.env.DB_HOST` available as `db.host`, Java-style `.properties` files parsed with array notation.

## Must-Haves

- Java properties file parser: `a.b.c=value` → nested object, `a.b.c[0]=value` → array, `a.b.c[0].x=value` → array of objects, `#` comments, multi-line with `\`
- YAML file loading (via js-yaml)
- JSON file loading
- `PropertySourceChain` with layered precedence: programmatic → process.env → profile-specific files → default files → injected/node-config fallback
- `NODE_ACTIVE_PROFILES` environment variable (comma-separated) selects which `application-{profile}` files to load
- `process.env` flattened into config namespace: `MY_APP_PORT` → `my.app.port` (relaxed binding)
- File discovery: look in `config/` and cwd for `application.{json,yaml,yml,properties}` and `application-{profile}.{json,yaml,yml,properties}`
- Implements same `has(path)` / `get(path, defaultValue)` contract as EphemeralConfig
- Backward compatible — existing ConfigFactory/EphemeralConfig/ValueResolvingConfig still work
- All 296 existing tests pass

## Verification

- `cd /Users/craig/src/github/alt-javascript/altjs && npm test` — all 296+ tests pass
- `cd /Users/craig/src/github/alt-javascript/altjs/packages/config && npx mocha --require test/fixtures/index.js test/PropertySource.spec.js`
- `cd /Users/craig/src/github/alt-javascript/altjs/packages/config && npx mocha --require test/fixtures/index.js test/PropertiesParser.spec.js`

## Tasks

- [ ] **T01: Java properties file parser** `est:45m`
  - Why: Spring's primary config format; no JS library parses the full spec with array/nested object notation
  - Files: `packages/config/PropertiesParser.js`, `packages/config/test/PropertiesParser.spec.js`
  - Do: Parse `.properties` format: key=value lines, `#` comments, blank lines skipped, `\` line continuation, `a.b.c` → nested object, `a.b.c[0]` → c as array, `a.b.c[0].x` → c as array of objects. Return a plain JS object (same shape as JSON.parse of equivalent JSON).
  - Verify: Unit tests for all notation forms
  - Done when: Parser handles all Spring-compatible property notation

- [ ] **T02: PropertySourceChain — layered config with precedence** `est:1h`
  - Why: The core abstraction — multiple config sources queried in priority order
  - Files: `packages/config/PropertySourceChain.js`
  - Do: `PropertySourceChain` accepts an ordered array of source objects (each with `has()`/`get()`). `get(path)` queries sources in order, returns first hit. `has(path)` returns true if any source has it. Sources are added with priority — higher priority sources are queried first. Includes `EnvPropertySource` that wraps `process.env` with relaxed binding (`MY_APP_PORT` → `my.app.port`).
  - Verify: Unit tests for precedence ordering, env binding
  - Done when: Chain resolves properties with correct precedence

- [ ] **T03: Profile-aware file loading and NODE_ACTIVE_PROFILES** `est:1h`
  - Why: The Spring-aligned config loading — discover and load application files based on active profiles
  - Files: `packages/config/ProfileConfigLoader.js`, `packages/config/index.js`
  - Do: 1) Read `NODE_ACTIVE_PROFILES` from process.env (comma-separated). 2) Discover config files in `config/` and cwd: `application.{json,yaml,yml,properties}` then `application-{profile}.{json,yaml,yml,properties}` for each active profile. 3) Load each file (JSON via JSON.parse, YAML via js-yaml, properties via PropertiesParser). 4) Build PropertySourceChain with precedence: process.env → profile files (last profile wins) → default application files → programmatic/injected. 5) Export a `loadConfig()` function that returns a PropertySourceChain. 6) Add js-yaml as direct dependency of config package.
  - Verify: Integration test with temp config files and NODE_ACTIVE_PROFILES
  - Done when: Profile-aware config loads with correct precedence

- [ ] **T04: Integration tests and ConfigFactory integration** `est:45m`
  - Why: Prove the full system works end-to-end and integrates with existing ConfigFactory
  - Files: `packages/config/test/PropertySource.spec.js`, `packages/config/ConfigFactory.js`
  - Do: 1) Tests with real temp files: default JSON + profile YAML + env vars, verify precedence. 2) Properties file with array/nested notation. 3) NODE_ACTIVE_PROFILES selects correct files. 4) process.env accessible via config. 5) Wire into ConfigFactory as an alternative to node-config (opt-in via `ConfigFactory.loadConfig()` or auto-detect when node-config unavailable). 6) Ensure all 296 existing tests still pass.
  - Verify: Full test suite green
  - Done when: PropertySourceConfig fully integrated, backward compatible

## Files Likely Touched

- `packages/config/PropertiesParser.js`
- `packages/config/PropertySourceChain.js`
- `packages/config/EnvPropertySource.js`
- `packages/config/ProfileConfigLoader.js`
- `packages/config/ConfigFactory.js`
- `packages/config/index.js`
- `packages/config/package.json` (js-yaml dep)
- `packages/config/test/PropertiesParser.spec.js`
- `packages/config/test/PropertySource.spec.js`
