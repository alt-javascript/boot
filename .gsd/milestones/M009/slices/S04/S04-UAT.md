---
slice: S04
status: validated
---

# S04 UAT — example-5-1-advanced

## Acceptance Criteria

- [x] `TimingBeanPostProcessor` detected and wraps service beans
- [x] AOP proxy intercepts methods and logs timing; infrastructure beans skipped
- [x] `OrderPlacedEvent` published; `AuditService` receives via `onApplicationEvent()`
- [x] `DevOnlyGreeter` inactive on default profile; active when `profiles: 'dev'`
- [x] `NotificationService` receives `AuditService` via constructor injection
- [x] `AuditService` receives ApplicationContext via `setApplicationContext()`
- [x] 12 mocha tests pass; full regression green

## Verified

Commit `e88d1df`. 12 passing. 24/24 suites green.
