# M007: Frontend Integration — Browser-First CDI for SPAs

## Scope

Extend the alt-javascript framework into the browser with the same CDI, config, and service-layer patterns used on the server. URL-based profiles replace the v2 `WindowLocationSelectiveConfig` approach. Integration adapters for Vue (CDN + CLI), Alpine.js, React, and Angular.

## Goals

1. URL-based browser profiles that work like `NODE_ACTIVE_PROFILES` — declarative URL-to-profile mapping
2. CDN-first integration for Vue 3 and similar no-build frameworks
3. Module-bundler integration for React, Vue CLI, and Angular
4. Framework-agnostic service layer shared between browser and server

## Constraints

- No TypeScript compile step
- Browser ESM bundles must work with `<script type="module">` without a bundler
- CDI wiring must not fight framework idioms (Vue reactivity, React hooks, Angular DI)
- The adapter is a thin bridge — don't re-implement Vue/React/Angular patterns

## Key Decisions

- Replace `WindowLocationSelectiveConfig`'s URL-key encoding with profile-based mapping
- Profile resolution order in browser: URL mapping → query param `?profile=dev` → default
- CDI services exposed to frameworks via framework-native patterns (Vue `provide/inject`, React Context, Angular service)

## Prior Art

- Year-planner app (`/Users/craig/src/alt-html/year-planner/`) — boot 2.x with Vue CDN
- Existing `WindowLocationSelectiveConfig` — URL origin as config key with dots → `+` encoding
- Existing `ProfileConfigLoader` — file-based profile config loading (server-side)
- Existing `conditionalOnProfile` — conditional bean registration based on active profiles
