# S09 UAT — No-Build Vue CDN Example

**Status:** Ready for human sign-off

---

## Package

`packages/example-4-1-frontend-vue-cdn`

## What this demonstrates

- Vue 3 CDN app — zero build step, pure `<script type="module">` in HTML
- CDI `ApplicationContext` bootstrapped in the browser via importmap
- `TodoService` CDI bean wired and provided to Vue via `app.provide()`
- Two delivery modes:
  - `index.html` — jsDelivr CDN importmap (requires internet)
  - `dev.html` — local importmap served by `server.js` (no internet needed)
- `npm test` — CDI service layer tested in Node (framework-agnostic service)
- `npm run serve` — local dev server at `http://localhost:3000/dev`

## How to run

```bash
cd packages/example-4-1-frontend-vue-cdn

# Unit tests (Node — tests the CDI service layer)
npm test

# Local browser demo (no internet, no build step)
npm run serve
# Open: http://localhost:3000/dev
```

## Expected behaviour

- Page loads showing two seeded todos
- "Add" button adds a new todo
- Checkbox toggles done/strikethrough
- ✕ button removes a todo
- All reactivity driven by Vue; all business logic in CDI beans

## Evidence from implementation run

- 5/5 unit tests pass (TodoService CDI bean)
- Browser: Vue app mounts, todos render from CDI-seeded service
- Add/toggle/remove interactions verified in browser

## Acceptance Checklist

- [ ] `npm test` — 5 service tests pass
- [ ] `npm run serve` + open `http://localhost:3000/dev` — Vue app renders with 2 seeded todos
- [ ] Add a todo via the input — new item appears reactively
- [ ] Toggle a todo — strikethrough applied
- [ ] Remove a todo — item disappears
- [ ] No build step — page is plain HTML + ES modules

---

## Feedback Notes

> _(Add observations, issues, or suggestions before signing off)_

The vue cdn example should be html first, with the page structure directly declared as html,
not with a template constant in the script tag, that is VUE without template compilation,
aimed for use either in nobuild, or page serving applications (ruby-on-rails, spring mvc with thymelaef)
like other frameworks like backbone.js.

The current is a hybrid that satisfies niether the serverside rendered pages or CLI first modes.

---

## Sign-Off

- [ ] **I have run the example and all checklist items above are satisfied.**

  Signed off by: __________________ Date: __________________
