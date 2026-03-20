# S02: BeanPostProcessor + Application Events

**Goal:** ApplicationContext supports BeanPostProcessor hooks and an integrated event system that fires lifecycle events during context startup and shutdown.
**Demo:** A custom BeanPostProcessor logs every bean created; ContextRefreshedEvent fires after prepare(); event-listener beans auto-detected via `onApplicationEvent` convention method.

## Must-Haves

- `BeanPostProcessor` interface with `postProcessBeforeInitialization(instance, name)` and `postProcessAfterInitialization(instance, name)`
- ApplicationContext calls BeanPostProcessors between creation/injection and initialization for every singleton
- `ApplicationEventPublisher` registered as a context-managed singleton
- `ContextRefreshedEvent` published after prepare() completes
- `ContextClosedEvent` published during destroy
- Convention-based listener detection: beans with `onApplicationEvent(event)` auto-subscribed
- All 207 existing tests still pass

## Proof Level

- This slice proves: integration
- Real runtime required: yes (ApplicationContext lifecycle)
- Human/UAT required: no

## Verification

- `cd /Users/craig/src/github/alt-javascript/altjs && npm test` — all 207+ tests pass
- `cd /Users/craig/src/github/alt-javascript/altjs/packages/cdi && npx mocha --require test/fixtures/index.js test/BeanPostProcessor.spec.js` — BeanPostProcessor tests pass
- `cd /Users/craig/src/github/alt-javascript/altjs/packages/cdi && npx mocha --require test/fixtures/index.js test/Events.spec.js` — Event integration tests pass

## Observability / Diagnostics

- Runtime signals: verbose logging in ApplicationContext for each BeanPostProcessor call, event publish
- Inspection surfaces: `applicationContext.get('applicationEventPublisher')` returns publisher instance
- Failure visibility: BeanPostProcessor exceptions surface with bean name and phase in error message
- Redaction constraints: none

## Integration Closure

- Upstream surfaces consumed: `ApplicationContext.js` lifecycle methods (prepare, createSingletons, initialiseSingletons, registerSingletonDestroyers)
- New wiring introduced in this slice: BeanPostProcessor hooks in singleton lifecycle; ApplicationEventPublisher as auto-registered context component; convention-based event listener detection
- What remains before the milestone is truly usable end-to-end: S03 (auto-discovery, conditions), S04 (AOP integration via BeanPostProcessor, constructor injection, browser bundles)

## Tasks

- [ ] **T01: Event system and BeanPostProcessor classes** `est:30m`
  - Why: Production event classes and BeanPostProcessor interface needed in the cdi package before integrating into ApplicationContext
  - Files: `packages/cdi/events/ApplicationEvent.js`, `packages/cdi/events/ApplicationEventPublisher.js`, `packages/cdi/events/ContextRefreshedEvent.js`, `packages/cdi/events/ContextClosedEvent.js`, `packages/cdi/events/index.js`, `packages/cdi/BeanPostProcessor.js`
  - Do: Port PoC Events.js into proper cdi modules. Create BeanPostProcessor base class with `postProcessBeforeInitialization(instance, name)` and `postProcessAfterInitialization(instance, name)` methods that return the instance by default. Export all from cdi index.
  - Verify: Files exist and export correctly via `node -e "import {...} from '@alt-javascript/cdi'"`
  - Done when: Event classes and BeanPostProcessor importable from `@alt-javascript/cdi`

- [ ] **T02: Integrate BeanPostProcessor + events into ApplicationContext lifecycle** `est:1h`
  - Why: The core integration — ApplicationContext must detect BeanPostProcessors, call them during lifecycle, auto-register event publisher, publish lifecycle events, and detect convention-based listeners
  - Files: `packages/cdi/ApplicationContext.js`
  - Do: 1) After parseContexts(), identify BeanPostProcessor components. 2) After creating each singleton and wiring dependencies, call `postProcessBeforeInitialization` then `postProcessAfterInitialization` for each registered BeanPostProcessor. 3) Auto-register ApplicationEventPublisher as `applicationEventPublisher` singleton. 4) After prepare() completes, publish ContextRefreshedEvent. 5) During destroy/shutdown, publish ContextClosedEvent. 6) After initializing singletons, detect beans with `onApplicationEvent` method and auto-subscribe them.
  - Verify: `npm test` — all existing 207 tests pass (backward compatibility)
  - Done when: ApplicationContext lifecycle includes BeanPostProcessor hooks and event publishing, zero regressions

- [ ] **T03: Tests for BeanPostProcessor and events** `est:45m`
  - Why: Prove the integration works — custom BeanPostProcessors modify beans, lifecycle events fire, convention listeners receive events
  - Files: `packages/cdi/test/BeanPostProcessor.spec.js`, `packages/cdi/test/Events.spec.js`, test service classes as needed
  - Do: Write tests: 1) BeanPostProcessor.postProcessBeforeInitialization called for each singleton. 2) BeanPostProcessor.postProcessAfterInitialization called for each singleton. 3) BeanPostProcessor can modify/replace bean instance. 4) ContextRefreshedEvent fires after context start. 5) Convention-based listener (onApplicationEvent) receives lifecycle events. 6) ApplicationEventPublisher retrievable from context. 7) Custom events can be published and received. 8) Multiple BeanPostProcessors called in order.
  - Verify: `cd packages/cdi && npx mocha --require test/fixtures/index.js test/BeanPostProcessor.spec.js test/Events.spec.js`
  - Done when: All new tests pass, full suite 207+ green

## Files Likely Touched

- `packages/cdi/ApplicationContext.js`
- `packages/cdi/BeanPostProcessor.js`
- `packages/cdi/events/ApplicationEvent.js`
- `packages/cdi/events/ApplicationEventPublisher.js`
- `packages/cdi/events/ContextRefreshedEvent.js`
- `packages/cdi/events/ContextClosedEvent.js`
- `packages/cdi/events/index.js`
- `packages/cdi/index.js`
- `packages/cdi/test/BeanPostProcessor.spec.js`
- `packages/cdi/test/Events.spec.js`
