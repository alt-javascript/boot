# S15 UAT — `programming-altjs` Skill

**Status:** ⏳ Pending implementation

---

## Acceptance Checklist

**All boxes must be checked before M008 is marked complete.**

### Skill file

- [ ] `~/.gsd/agent/skills/programming-altjs/SKILL.md` exists and is readable
- [ ] Skill description accurately triggers on `@alt-javascript` code tasks

### Guard rails — Boot.boot()

- [ ] Skill instructs agent to always call `Boot.boot({ config })` before `ApplicationContext`
- [ ] Skill notes duck-typed config acceptance

### Guard rails — config patterns

- [ ] Skill documents `EphemeralConfig`, `ProfileAwareConfig`, file-based config
- [ ] Skill notes correct config directory structure (`config/default.json`, `config/{profile}.json`)

### Guard rails — logging

- [ ] Skill documents text vs JSON log format config key
- [ ] Skill documents log level by category convention

### Guard rails — DI wiring

- [ ] Skill documents null-property autowiring pattern
- [ ] Skill documents `Context`, `Singleton`, `Prototype`, `Service` usage

### Guard rails — testing

- [ ] Skill instructs agent to use `Boot.test()` in test fixtures
- [ ] Skill notes banner suppression in tests

### Validation

- [ ] Skill tested against at least one example: agent asked to "add a new service to
      example-console-app" produces correct, idiomatic code on first attempt

---

## Feedback Notes

> _(Free text — observations, issues, suggestions)_

---

## Sign-Off

- [ ] **Skill tested and all checklist items above are satisfied.**

  Signed off by: __________________ Date: __________________
