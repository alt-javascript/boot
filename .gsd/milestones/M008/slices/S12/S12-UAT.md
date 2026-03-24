# S12 UAT — Angular (`example-4-4-frontend-angular`)

**Status:** Ready for human sign-off

---

## Package

`packages/example-4-4-frontend-angular`

## What this demonstrates

- Angular 21 standalone app built with Vite (via `@analogjs/vite-plugin-angular`)
- CDI `ApplicationContext` bootstrapped via `angularStarter()` (Boot.boot() internally)
- `TodoService` CDI bean provided via `angularStarter()` as Angular injection token
- Angular component accesses bean via `inject('todoService')` string token
- URL → profile mapping automatic: `Boot.boot()` reads `profiles.urls` from the config POJO
- `vite.config.ts` has zero `resolve.alias` entries — exports conditions handle routing
- `@Component` standalone with `NgFor`, `NgClass`, `FormsModule` — no NgModule
- Angular signals (`signal<any[]>([])`) for reactive state
- `boot-angular` updated: `angularStarter()` added — mirrors `vueStarter`/`reactStarter`,
  calls `Boot.boot()` for full profile resolution, banner, and logger setup
- Workspace upgraded to Vite 6 (required by `@angular/build@21`); `overrides` in root
  `package.json` ensures all workspace packages use Vite 6
- 5 Vitest tests covering the CDI service layer (run in jsdom via separate `vitest.config.js`)

## How to run

```bash
cd packages/example-4-4-frontend-angular

# Unit tests (Vitest / jsdom — no Angular runtime needed)
npm test

# Development server
npm run dev
# Open: http://localhost:5175  → DEV badge (green)
#       http://127.0.0.1:5175  → LOCAL badge (blue)
```

## Expected behaviour

- Page loads with profile badge showing `DEV` (localhost) or `LOCAL` (127.0.0.1)
- Subtitle shows `profile resolved automatically by Boot.boot()`
- Two seeded todos render from CDI-injected `TodoService`
- "Add" button / Enter key adds a new todo
- Checkbox toggles done/strikethrough
- ✕ button removes a todo
- All state managed with Angular signals; all business logic in CDI beans

## Evidence from implementation run

- 5/5 Vitest tests pass (`TodoService` CDI bean)
- Dev server: `localhost:5175` → DEV badge, `development (localhost)` env
- Dev server: `127.0.0.1:5175` → LOCAL badge, `local (127.0.0.1)` env
- No console errors on either URL
- `vite.config.ts`: no `resolve.alias`
- All 20 mocha suites still pass (no regressions)
- S10 and S11 Vitest suites still 5/5 after Vite 6 upgrade

## Acceptance Checklist

- [x] `npm test` — 5 Vitest service tests pass
- [x] `npm run dev` → `http://localhost:5175` — Angular app renders, DEV badge visible
- [x] `http://127.0.0.1:5175` — LOCAL badge visible, different env string shown
- [x] Profile resolved automatically from URL — no manual `BrowserProfileResolver` in `main.ts`
- [x] Add a todo via input — new item appears reactively
- [x] Toggle a todo — strikethrough applied
- [x] Remove a todo — item disappears
- [x] `vite.config.ts` contains no `resolve.alias` entries
- [x] No console errors in browser

---

## Feedback Notes

> _(Add observations, issues, or suggestions before signing off)_

---

## Sign-Off

- [ ] **I have run the example and all checklist items above are satisfied.**

  Signed off by: __________________ Date: __________________
