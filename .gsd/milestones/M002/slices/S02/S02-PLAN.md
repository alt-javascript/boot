# S02: BeanPostProcessor + Application Events

**Goal:** ApplicationContext supports BeanPostProcessor hooks and an integrated event system that fires lifecycle events during context startup and shutdown.
**Demo:** After this: ApplicationContext fires ContextRefreshedEvent/ContextClosedEvent during lifecycle; custom BeanPostProcessors can intercept bean creation

## Tasks
- [x] **T01: Event system and BeanPostProcessor classes** — 
  - Files: packages/cdi/events/ApplicationEvent.js, packages/cdi/events/ApplicationEventPublisher.js, packages/cdi/events/ContextRefreshedEvent.js, packages/cdi/events/ContextClosedEvent.js, packages/cdi/events/index.js, packages/cdi/BeanPostProcessor.js
  - Verify: Files exist and export correctly via `node -e "import {...} from '@alt-javascript/cdi'"`
- [x] **T02: Integrate BeanPostProcessor + events into ApplicationContext lifecycle** — 
  - Files: packages/cdi/ApplicationContext.js
  - Verify: `npm test` — all existing 207 tests pass (backward compatibility)
- [x] **T03: Tests for BeanPostProcessor and events** — 
  - Files: packages/cdi/test/BeanPostProcessor.spec.js, packages/cdi/test/Events.spec.js, test service classes as needed
  - Verify: `cd packages/cdi && npx mocha --require test/fixtures/index.js test/BeanPostProcessor.spec.js test/Events.spec.js`
