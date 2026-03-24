# S13 UAT — Alpine.js (`example-4-5-frontend-alpine`)

**Status:** ✅ Signed off

---

## How to run

```bash
cd packages/example-4-5-frontend-alpine
npm install
npm run serve
```

Open http://localhost:3002/dev (DEV profile) or http://127.0.0.1:3002/dev (LOCAL profile)

---

## Acceptance Checklist

### Runs without errors

- [x] Dev server starts on port 3002 without errors
- [x] No unhandled promise rejections or uncaught exceptions in browser console

### Config loading

- [x] Default config loads; `app.env` defaults to `'default'`
- [x] `localhost` → `dev` profile; `app.env` shows `development (localhost)` with green DEV badge
- [x] `127.0.0.1` → `local` profile; `app.env` shows `local (127.0.0.1)` with blue LOCAL badge
- [x] Profile URL resolution is automatic (no manual `BrowserProfileResolver` calls)

### Logging

- [x] Boot banner printed to console
- [x] Log level controlled by profile (`debug` in dev/local, `info` in default)

### Dependency injection

- [x] `TodoService` is a CDI singleton, autowired with logger and config
- [x] `init()` seeds two items; both appear in the list on page load
- [x] Add / toggle / remove operations work correctly and update the list reactively

### Boilerplate check

- [x] `index.html` / `dev.html` are minimal — `alpineStarter()` + declarative `x-*` directives only
- [x] No custom store management required in caller code — `alpineStarter` handles it

### Framework-specific

- [x] Alpine.js CDN loaded via `<script defer>`
- [x] Placeholder store pattern: `{ ready: false }` registered during `alpine:init` synchronously
- [x] Store mutated in-place after `Boot.boot()` completes; Alpine reactivity triggers re-render
- [x] `x-show="$store.cdi.ready"` gates content; loading state shown while booting
- [x] HTML-first: all `v-*`/`x-*` directives in markup, not JS template strings

### Distribution

- [x] `dist/alt-javascript-boot-alpine-esm.js` built via rollup; all `@alt-javascript/*` → jsDelivr CDN URLs
- [x] `lodash` fully removed from `@alt-javascript/cdi` and entire monorepo
- [x] CDI dist browser import fixes: no broken `config`/`loggerFactory` singleton imports

### Tests

- [x] 10/10 unit tests pass (`packages/boot-alpine/test/AlpineIntegration.spec.js`)
- [x] 5/5 service tests pass (`packages/example-4-5-frontend-alpine/test/services.spec.js`)

---

## Sign-Off

- [x] **I have run the example and all checklist items above are satisfied.**

  Signed off: user · Date: 2026-03-21
