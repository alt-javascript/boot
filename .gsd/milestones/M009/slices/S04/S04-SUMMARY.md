---
slice: S04
status: complete
completed: 2026-03-24
commit: e88d1df
---

# S04 Summary — example-5-1-advanced

Built `packages/example-5-1-advanced` demonstrating six CDI features in one runnable app.

**Features demonstrated:**
1. **BeanPostProcessor** — `TimingBeanPostProcessor` detected and called by CDI
2. **AOP** — `createProxy()` wraps service beans with around-advice; measures ms; skips infrastructure beans
3. **Application events** — `OrderPlacedEvent extends ApplicationEvent`; `AuditService.onApplicationEvent()` listener; `applicationEventPublisher.publish()` (not `publishEvent` — corrected)
4. **Conditional beans** — `DevOnlyGreeter` with `static profiles = ['dev']`; only active when dev profile set
5. **Constructor injection** — `NotificationService` with `static constructorArgs = ['auditService']`
6. **setApplicationContext** — `AuditService` receives the running context

**Bug discovered:** `Boot.boot()` does not forward `profiles` option to `ApplicationContext`.
Dev profile test constructs `ApplicationContext` directly with `profiles: 'dev'`. Filed as a known
gap — not fixed in Boot to avoid scope creep.

12 tests green.
