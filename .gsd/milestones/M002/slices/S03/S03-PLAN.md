# S03: Auto-Discovery + Conditional Registration

**Goal:** ApplicationContext supports `scan()` for auto-discovering components via `static __component` metadata, and conditional bean registration via `condition` property evaluated during context preparation.
**Demo:** After this: components with static __component are auto-discovered; conditionalOnProperty/MissingBean/Bean filter registration

## Tasks
- [x] **T01: Auto-discovery and conditions modules in cdi** — 
  - Files: packages/cdi/AutoDiscovery.js, packages/cdi/Conditions.js, packages/cdi/index.js
  - Verify: `node -e "import { scan, discover, conditionalOnProperty } from '@alt-javascript/cdi'"`
- [x] **T02: Integrate conditions into ApplicationContext.parseContextComponent** — 
  - Files: packages/cdi/ApplicationContext.js
  - Verify: `npm test` — 223 existing tests pass (no conditions = no filtering = backward compatible)
- [x] **T03: Tests for auto-discovery and conditions** — 
  - Files: packages/cdi/test/AutoDiscovery.spec.js, packages/cdi/test/Conditions.spec.js
  - Verify: `cd packages/cdi && npx mocha --require test/fixtures/index.js test/AutoDiscovery.spec.js test/Conditions.spec.js`
