# S11 UAT — React (`example-4-3-frontend-react`)

**Status:** Ready for human sign-off

---

## Package

`packages/example-4-3-frontend-react`

## What this demonstrates

- React 18 app built with Vite — idiomatic CLI-first React development
- CDI `ApplicationContext` bootstrapped in the browser via `Boot.boot()`
- `TodoService` CDI bean accessed via `useCdi()` hook and `appCtx.get()`
- URL → profile mapping automatic: `Boot.boot()` reads `profiles.urls` from the config
  POJO and resolves the active profile from `window.location` — no manual
  `BrowserProfileResolver` / `ProfileAwareConfig` wiring in application code
- `vite.config.js` has **zero** `resolve.alias` entries — exports conditions handle routing
- Module-level `CdiContext` + `useCdi()` / `useBean()` hooks in `src/cdi-context.js` —
  standard React pattern, importable from any component in the tree
- `boot-react` updated: `reactStarter()` added (mirrors `vueStarter`) — calls `Boot.boot()`
  for full profile resolution, banner, and logger setup
- 5 Vitest tests covering the CDI service layer (run in jsdom)

## How to run

```bash
cd packages/example-4-3-frontend-react

# Unit tests (Vitest / jsdom)
npm test

# Development server
npm run dev
# Open: http://localhost:5174  → DEV badge (green)
#       http://127.0.0.1:5174  → LOCAL badge (blue)

# Production build
npm run build
```

## Expected behaviour

- Page loads with profile badge showing `DEV` (localhost) or `LOCAL` (127.0.0.1)
- Subtitle shows `profile resolved automatically by Boot.boot()`
- Two seeded todos render from CDI-injected `TodoService`
- "Add" button / Enter key adds a new todo
- Checkbox toggles done/strikethrough
- ✕ button removes a todo
- All state managed with React `useState`; all business logic in CDI beans

## Evidence from implementation run

- 5/5 Vitest tests pass (`TodoService` CDI bean)
- Dev server: `localhost:5174` → DEV badge, `development (localhost)` env
- Dev server: `127.0.0.1:5174` → LOCAL badge, `local (127.0.0.1)` env
- No console errors on either URL
- `vite.config.js`: no `resolve.alias`
- All 20 mocha suites still pass (no regressions)

## Acceptance Checklist

- [x] `npm test` — 5 Vitest service tests pass
- [x] `npm run dev` → `http://localhost:5174` — React app renders, DEV badge visible
- [x] `http://127.0.0.1:5174` — LOCAL badge visible, different env string shown
- [x] Profile resolved automatically from URL — no manual `BrowserProfileResolver` in `main.jsx`
- [x] Add a todo via input — new item appears reactively
- [x] Toggle a todo — strikethrough applied
- [x] Remove a todo — item disappears
- [x] `vite.config.js` contains no `resolve.alias` entries
- [x] No console errors in browser

---

## Feedback Notes

> _(Add observations, issues, or suggestions before signing off)_

---

## Sign-Off

- [x] **I have run the example and all checklist items above are satisfied.**

  Signed off by: craigparra Date: 2026-043-24  
