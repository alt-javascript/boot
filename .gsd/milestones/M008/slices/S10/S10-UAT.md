# S10 UAT — Vue (Vite) (`example-4-2-frontend-vue-vite`)

**Status:** Ready for human sign-off

---

## Package

`packages/example-4-2-frontend-vue-vite`

## What this demonstrates

- Vue 3 SFC app built with Vite — idiomatic CLI-first Vue development
- CDI `ApplicationContext` bootstrapped in the browser via `vueStarter()`
- `TodoService` CDI bean injected into the Vue component tree via `inject()`
- URL → profile mapping automatic: `Boot.boot()` reads `profiles.urls` from the config
  POJO and resolves the active profile from `window.location` — no manual
  `BrowserProfileResolver` / `ProfileAwareConfig` wiring in application code
- `vite.config.js` has **zero** `resolve.alias` entries — `@alt-javascript/*` packages
  declare `exports` conditions that route bundlers to browser-safe entries automatically
  (S16 outcome: no `fs` / `jasypt` / `createRequire` reaching the browser bundle)
- 5 Vitest tests covering the CDI service layer (run in jsdom)

## How to run

```bash
cd packages/example-4-2-frontend-vue-vite

# Unit tests (Vitest / jsdom)
npm test

# Development server
npm run dev
# Open: http://localhost:5173  → DEV badge (green)
#       http://127.0.0.1:5173  → LOCAL badge (blue)

# Production build
npm run build
# Output: dist/ — clean, no Node module warnings
```

## Expected behaviour

- Page loads with profile badge showing `DEV` (localhost) or `LOCAL` (127.0.0.1)
- Subtitle shows `profile resolved automatically by Boot.boot()`
- Two seeded todos render from CDI-injected `TodoService`
- "Add" button / Enter key adds a new todo
- Checkbox toggles done/strikethrough
- ✕ button removes a todo
- All reactivity driven by Vue SFC; all business logic in CDI beans

## Evidence from implementation run

- 5/5 Vitest tests pass (`TodoService` CDI bean)
- Dev server: `localhost:5173` → DEV badge, `development (localhost)` env
- Dev server: `127.0.0.1:5173` → LOCAL badge, `local (127.0.0.1)` env
- `vite build` clean: 73 modules transformed, no warnings, 4 output files
- No console errors on either URL
- `vite.config.js`: no `resolve.alias`, no `jasypt-browser-stub.js`

## Acceptance Checklist

- [x] `npm test` — 5 Vitest service tests pass
- [x] `npm run dev` → `http://localhost:5173` — Vue SFC app renders, DEV badge visible
- [x] `http://127.0.0.1:5173` — LOCAL badge visible, different env string shown
- [x] Profile resolved automatically from URL — no manual `BrowserProfileResolver` call in `main.js`
- [x] Add a todo via input — new item appears reactively
- [x] Toggle a todo — strikethrough applied
- [x] Remove a todo — item disappears
- [x] `vite.config.js` contains no `resolve.alias` entries
- [x] `npm run build` — production build succeeds with no Node module warnings
- [x] Log level from profile-specific config is applied (debug in dev/local)

---

## Feedback Notes

> _(Add observations, issues, or suggestions before signing off)_

---

## Sign-Off

- [ ] **I have run the example and all checklist items above are satisfied.**

  Signed off by: __________________ Date: __________________
