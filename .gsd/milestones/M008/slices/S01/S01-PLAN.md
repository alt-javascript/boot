# S01: Console Application

**Goal:** Build `packages/example-console-app` — a minimal but complete console application
that demonstrates idiomatic `@alt-javascript` usage: config loading, profiles, logging
(text + JSON), and DI wiring. This is the canonical pattern all other slices reference.

**Demo:** `npm start` from `packages/example-console-app` prints a startup banner, logs at
the configured level, and outputs a service result that proves DI wiring is working.
Switching `NODE_ACTIVE_PROFILES=dev` changes a config value visible in the output.

## Must-Haves

- `packages/example-console-app/` is a valid npm workspace member with its own `package.json`
- Uses workspace `@alt-javascript/*` packages (not registry versions)
- `config/default.json` — base config with logging, app name, and a demo value
- `config/dev.json` — dev profile that overrides at least one value
- `src/services.js` — at least two classes: one repository, one service with autowired dep
- `main.js` — entry point: `Boot.boot()`, context, `ApplicationContext.start()`, get service,
  log result. No more than ~25 lines
- Logging in text format by default; JSON format switchable via `boot.log-format: json`
- `npm start` exits cleanly

## Proof Level

- This slice proves: operational
- Real runtime required: yes (`node main.js`)
- Human/UAT required: yes — see `S01-UAT.md`

## Verification

1. `npm start` exits with code 0
2. Output contains a service result line (DI wiring confirmed)
3. `NODE_ACTIVE_PROFILES=dev npm start` outputs a different value for the overridden key
4. `S01-UAT.md` signed off by user before S02 begins

## Tasks

- [ ] **T01: Scaffold package** `est:30m`
  - Create `packages/example-console-app/package.json` with workspace deps
  - Add to root `package.json` workspaces if not already covered by glob
  - Create `config/` directory structure

- [ ] **T02: Services and main entry** `est:45m`
  - Write `src/services.js` with `GreetingRepository` and `GreetingService`
  - Write `main.js` using `Boot.boot()`, `ApplicationContext`, profiles
  - Verify `npm start` runs

- [ ] **T03: Logging formats and UAT prep** `est:30m`
  - Verify text logging (default) and JSON logging (via config switch)
  - Verify profile override changes output
  - Populate `S01-UAT.md` with actual run output as evidence
  - **STOP — await human UAT sign-off before marking S01 complete**
