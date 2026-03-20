# M007: Frontend Integration — Browser-First CDI for SPAs

**Vision:** Developers use the same CDI, config, and service-layer patterns in the browser that they use on the server. Framework-agnostic services wire into Vue, React, Angular, or any other frontend framework with minimal ceremony. URL-based profiles drive config just like `NODE_ACTIVE_PROFILES` does on the server, enabling per-environment configuration in SPAs without a build step.

## Success Criteria

- URL-based browser profiles work like server-side profiles: `localhost:8080` activates `dev` config, `prod.example.com` activates `prod` config — driven by declarative URL-to-profile mapping
- Vue CDN app boots CDI from a `<script type="module">`, wires services, and exposes them to Vue's reactive system
- The same pattern works for other CDN-first frameworks (Alpine.js, Petite-Vue, HTMX companion scripts)
- React, Vue (CLI), and Angular apps integrate CDI via their respective module systems
- All integration patterns use the same `__component` / context definition format
- Service layer code (e.g. `Api.js`, `StorageLocal.js`) is identical between browser and server

## Key Risks / Unknowns

- **URL profile mapping ergonomics** — The v2 pattern of encoding dots as `+` in URL keys is ugly. Need a cleaner mapping syntax that doesn't require escaping.
- **Vue reactivity boundary** — CDI singletons aren't reactive by default. Need to find the right handoff point where CDI services meet Vue's `reactive()`/`ref()` system.
- **React integration depth** — React's hook-centric model may resist external DI. Need to find an ergonomic bridge (Context API? custom hook?) that doesn't fight React's grain.
- **CDN ESM bundles** — Current rollup config produces browser ESM bundles. Need to verify they work with `<script type="module">` and CDN imports in v3.

## Proof Strategy

- URL profiles → retire in S01 by implementing and testing URL-to-profile mapping in config
- Vue CDN integration → retire in S02 by building a working Vue CDN app with CDI services
- CDN-first framework coverage → retire in S03 by testing Alpine.js / Petite-Vue / similar
- React/Vue/Angular CLI integration → retire in S04-S05 by building working examples

## Verification Classes

- Contract verification: mocha tests for URL profile mapping, browser config behaviour
- Integration verification: working browser apps that boot CDI and render data
- UAT / human verification: open in browser, verify services resolve, data renders

## Milestone Definition of Done

This milestone is complete only when all are true:

- URL-based profiles resolve config per-environment in the browser
- At least one CDN-first Vue app demonstrates CDI wiring without a build step
- At least one CDN-first alternative framework demonstrates the same pattern
- React and Vue CLI integration patterns are documented and tested
- All tests pass including browser-targetted config tests

## Requirement Coverage

- Covers: R001 (IoC/DI in browser), R005 (config profiles in browser), R009 (isomorphic)
- Partially covers: R008 (cross-subsystem integration — frontend to backend service symmetry)
- Leaves for later: server-side rendering, hydration

## Slices

- [x] **S01: URL-Based Browser Profiles** `risk:high` `depends:[]`
- [x] **S02: Vue CDN Integration** `risk:medium` `depends:[S01]`
- [x] **S03: CDN-First Framework Coverage** `risk:medium` `depends:[S02]`
- [x] **S04: React Integration** `risk:high` `depends:[S01]`
- [x] **S05: Vue CLI + Angular Integration** `risk:medium` `depends:[S04]`

## Boundary Map

### S01 → S02

Produces:
- URL-to-profile mapping in browser config
- Profile-aware `ConfigFactory.getConfig()` for browser environments
- Config keys like `profiles.urls` for declarative mapping

Consumes:
- Existing `WindowLocationSelectiveConfig`, `ProfileConfigLoader`, `conditionalOnProfile`

### S02 → S03

Produces:
- Vue CDN integration pattern (boot CDI → bridge to Vue reactivity)
- Example app structure for CDN-first SPAs

### S01 → S04

Produces:
- Browser config with profiles (shared across all frontend integrations)
- CDI browser ESM bundle that works in module bundlers (Webpack, Vite, esbuild)
