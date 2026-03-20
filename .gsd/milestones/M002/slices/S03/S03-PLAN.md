# S03: Auto-Discovery + Conditional Registration

**Goal:** ApplicationContext supports `scan()` for auto-discovering components via `static __component` metadata, and conditional bean registration via `condition` property evaluated during context preparation.
**Demo:** Classes with `static __component = true` auto-discovered and registered; beans with `conditionalOnProperty('feature.x', true)` only registered when config matches; `conditionalOnMissingBean` provides smart defaults.

## Must-Haves

- `scan(classes)` function returns component definitions from `static __component` metadata
- `ComponentRegistry` for programmatic registration
- `discover(classes)` convenience merges scan + registry
- `ApplicationContext` accepts scanned/discovered components
- `conditionalOnProperty`, `conditionalOnMissingBean`, `conditionalOnBean` condition functions
- `evaluateConditions` integrated into `parseContextComponent` pipeline
- All 223 existing tests still pass

## Proof Level

- This slice proves: integration
- Real runtime required: yes (ApplicationContext lifecycle with conditions)
- Human/UAT required: no

## Verification

- `cd /Users/craig/src/github/alt-javascript/altjs && npm test` — all 223+ tests pass
- `cd /Users/craig/src/github/alt-javascript/altjs/packages/cdi && npx mocha --require test/fixtures/index.js test/AutoDiscovery.spec.js` — auto-discovery tests pass
- `cd /Users/craig/src/github/alt-javascript/altjs/packages/cdi && npx mocha --require test/fixtures/index.js test/Conditions.spec.js` — conditions tests pass

## Tasks

- [ ] **T01: Auto-discovery and conditions modules in cdi** `est:30m`
  - Why: Production modules needed before integration — port PoC scan/discover/conditions into cdi package
  - Files: `packages/cdi/AutoDiscovery.js`, `packages/cdi/Conditions.js`, `packages/cdi/index.js`
  - Do: Port PoC AutoDiscovery.js (scan, discover, ComponentRegistry, COMPONENT_META_KEY) and Conditions.js (conditionalOnProperty, conditionalOnMissingBean, conditionalOnBean, conditionalOnClass, allOf, anyOf, evaluateConditions) into cdi package. Export all from cdi index.
  - Verify: `node -e "import { scan, discover, conditionalOnProperty } from '@alt-javascript/cdi'"`
  - Done when: All auto-discovery and condition functions importable from `@alt-javascript/cdi`

- [ ] **T02: Integrate conditions into ApplicationContext.parseContextComponent** `est:30m`
  - Why: Conditions must be evaluated during context preparation so conditional beans are filtered before creation
  - Files: `packages/cdi/ApplicationContext.js`
  - Do: In parseContextComponent, check if `component.condition` exists. If so, evaluate it with `(this.config, this.components)`. If false, skip registration (log at verbose). This happens before the duplicate check and before adding to `this.components`.
  - Verify: `npm test` — 223 existing tests pass (no conditions = no filtering = backward compatible)
  - Done when: Components with `condition` property are filtered during parseContextComponent

- [ ] **T03: Tests for auto-discovery and conditions** `est:45m`
  - Why: Prove scan, discover, conditions, and their integration with ApplicationContext all work
  - Files: `packages/cdi/test/AutoDiscovery.spec.js`, `packages/cdi/test/Conditions.spec.js`
  - Do: Write tests: 1) scan detects __component classes. 2) scan ignores classes without __component. 3) ComponentRegistry register/drain cycle. 4) discover merges scan + registry. 5) conditionalOnProperty passes/fails correctly. 6) conditionalOnMissingBean skips when bean exists. 7) conditionalOnBean registers when bean exists. 8) ApplicationContext with conditional components. 9) Scanned components work through full lifecycle.
  - Verify: `cd packages/cdi && npx mocha --require test/fixtures/index.js test/AutoDiscovery.spec.js test/Conditions.spec.js`
  - Done when: All new tests pass, full suite 223+ green

## Files Likely Touched

- `packages/cdi/AutoDiscovery.js`
- `packages/cdi/Conditions.js`
- `packages/cdi/ApplicationContext.js`
- `packages/cdi/index.js`
- `packages/cdi/test/AutoDiscovery.spec.js`
- `packages/cdi/test/Conditions.spec.js`
