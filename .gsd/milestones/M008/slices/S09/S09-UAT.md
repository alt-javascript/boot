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

- [x] `npm test` — 5 service tests pass
- [x] `npm run serve` + open `http://localhost:3000/dev` — Vue app renders with 2 seeded todos
- [x] Add a todo via the input — new item appears reactively
- [x] Toggle a todo — strikethrough applied
- [x] Remove a todo — item disappears
- [x] No build step — page is plain HTML + ES modules

---

## Feedback Notes

> _(Add observations, issues, or suggestions before signing off)_

The HTML first approach is good, but this is not an idomatic binding of vue _into_ the Boot ecosytem,
and is heavy on boiler plate that should be handled by the ESM dist coming from Boot-browser.

Similar to all the other setup examples,  but adapted for the browser, the config should just be
a plain pojo, and long with the context array, should be given to the browserified Boot.boot() which wraps
and enhances the config (it should support the url -> profile mapping, placeholders etc).

boot-vue createCdiApp does this work already but isn't used.  Why not?
Given that it wraps Boot.boot() internally, it needs a better name vueStarter matches the pattern elsewhere,
we need to consider how a CLI first idomatic Vue application is done as well, so that it
works the same for a CLI built app (the common / contemporary way).

### Done
The vue cdn example should be html first, with the page structure directly declared as html,
not with a template constant in the script tag, that is VUE without template compilation,
aimed for use either in nobuild, or page serving applications (ruby-on-rails, spring mvc with thymelaef)
like other frameworks like backbone.js.

The current is a hybrid that satisfies niether the serverside rendered pages or CLI first modes.

---

## Sign-Off

- [x] **I have run the example and all checklist items above are satisfied.**

  Signed off by: craigparra Date: 2026-043-24  
