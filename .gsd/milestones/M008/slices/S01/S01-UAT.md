# S01 UAT — Console Application (`example-console-app`)

**Status:** ⏳ Pending implementation

---

## How to run

```bash
cd packages/example-console-app
npm install
npm start
```

---

## Acceptance Checklist

Complete this checklist by running the example and checking each item.
**All boxes must be checked before S02 begins.**

### Runs without errors

- [ ] `npm start` exits with code 0
- [ ] No unhandled promise rejections or uncaught exceptions in output

### Config loading

- [ ] Default config (`config/default.json`) loads and values are used
- [ ] A second profile (e.g. `config/dev.json` or `NODE_ACTIVE_PROFILES=dev`) overrides at
      least one value and the override is visible in the output

### Logging

- [ ] Log lines appear in **text** format by default
- [ ] Switching to **JSON** format (via config) produces valid JSON log lines
- [ ] Setting log level to `debug` in config produces debug-level output
- [ ] Setting log level to `warn` suppresses info/debug lines

### Dependency injection

- [ ] At least one service with an autowired dependency runs correctly
- [ ] The service produces verifiably correct output (shown in console)

### Boilerplate check

- [ ] `main.js` / entry point is minimal — only `Boot.boot()`, context setup, and start
- [ ] No redundant wiring, no manual logger construction, no manual config wrapping

### Startup banner

- [ ] Banner prints on startup (default behaviour)
- [ ] Banner can be suppressed by setting `boot.banner-mode: off` in config

---

## Feedback Notes

> _(Free text — add any observations, issues found, or suggestions here before signing off)_

---

## Sign-Off

- [ ] **I have run the example and all checklist items above are satisfied.**

  Signed off by: __________________ Date: __________________
