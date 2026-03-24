# S04 Plan — example-5-1-advanced

## Objective

Build `packages/example-5-1-advanced` demonstrating six advanced CDI features
in a single application: BeanPostProcessor, AOP, application events, conditional
beans, constructor injection, setApplicationContext.

## Tasks

- [x] **T01: Scaffold package** `est:15min`
- [x] **T02: TimingBeanPostProcessor + createProxy (AOP)** `est:1h`
- [x] **T03: OrderPlacedEvent + AuditService (events)** `est:45min`
- [x] **T04: NotificationService (constructor injection)** `est:30min`
- [x] **T05: DevOnlyGreeter (conditional/profile)** `est:30min`
- [x] **T06: OrderService + Application** `est:30min`
- [x] **T07: 12 mocha tests** `est:1h`

## Definition of Done

- All 6 CDI features exercised and tested
- `npm test -w packages/example-5-1-advanced` → 12 passing
- Full regression green

## Bug Fixes Discovered

- `ApplicationEventPublisher.publish()` not `publishEvent()` — corrected
- `Boot.boot()` does not forward `profiles` option — dev profile test uses `ApplicationContext` directly
