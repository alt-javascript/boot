# S14 UAT — Advanced Features (`example-advanced`)

**Status:** ⏳ Pending implementation

---

## How to run

```bash
cd packages/example-advanced
npm install
npm start
```

Verify AOP intercept, event, conditional bean, constructor injection all appear in output

---

## Acceptance Checklist

**All boxes must be checked before the next slice begins.**

### Runs without errors

- [ ] Start command completes without errors
- [ ] No unhandled promise rejections or uncaught exceptions

### Config loading

- [ ] Default config loads and values are used
- [ ] A profile override changes at least one value visibly

### Logging

- [ ] Log lines appear in **text** format by default
- [ ] JSON log format switchable via config
- [ ] Log level respected

### Dependency injection

- [ ] At least one service with an autowired dependency runs correctly
- [ ] Service produces verifiably correct output

### Boilerplate check

- [ ] Entry point is minimal — no unnecessary ceremony

### Framework-specific

- [ ] Adapter boots correctly (routes registered / handler wired / app mounted)
- [ ] At least one request/invocation returns expected response

---

## Feedback Notes

> _(Free text — observations, issues, suggestions)_

---

## Sign-Off

- [ ] **I have run the example and all checklist items above are satisfied.**

  Signed off by: __________________ Date: __________________
