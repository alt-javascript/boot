---
id: S01
parent: M012
milestone: M012
provides:
  - DotEnvParser — standalone .env format parser, exported from index.js
  - ProfileConfigLoader .env discovery — application.env and application-{profile}.env auto-loaded with relaxed binding
requires:
  []
affects:
  []
key_files:
  - packages/config/DotEnvParser.js
  - packages/config/ProfileConfigLoader.js
  - packages/config/test/DotEnvParser.spec.js
  - packages/config/test/ProfileConfigLoader.spec.js
  - packages/config/index.js
key_decisions:
  - _loadEnvFiles() is separate from _loadFiles() — .env files always wrap in EnvPropertySource, not EphemeralConfig
  - .env sources slot between process.env (slot 2) and profile config files (slot 3) — real env vars always win
  - Inline comment stripping requires # to be preceded by whitespace, preventing stripping of embedded # in values like HASH=val#tag
  - Multiline and variable interpolation deferred to v2
patterns_established:
  - _loadEnvFiles() pattern: separate from _loadFiles(), returns EnvPropertySource not EphemeralConfig — use this when adding any future env-like source format
observability_surfaces:
  - none
drill_down_paths:
  - packages/config/DotEnvParser.js
  - packages/config/test/DotEnvParser.spec.js
  - packages/config/ProfileConfigLoader.js
  - packages/config/test/ProfileConfigLoader.spec.js
duration: ""
verification_result: passed
completed_at: 2026-03-25T19:41:33.559Z
blocker_discovered: false
---

# S01: DotEnvParser + ProfileConfigLoader .env integration

**.env file support added to @alt-javascript/config with full relaxed binding and correct 7-layer precedence**

## What Happened

Implemented full .env file support in @alt-javascript/config across four tasks. DotEnvParser handles the complete standard .env format. ProfileConfigLoader discovers application.env and application-{profile}.env via the same SEARCH_DIRS loop, parses them with DotEnvParser, and wraps them in EnvPropertySource so UPPER_SNAKE_CASE keys get the same relaxed binding as process.env. The .env sources sit between process.env and regular config files in the precedence chain — real environment variables always win. 164 tests pass, 8 new integration tests cover every layer of the 7-level chain.

## Verification

164 tests passing. Full 7-layer precedence chain verified: overrides > process.env > profile.env > base.env > profile.json > base.json > fallback. DotEnvParser 28-case suite covers all format variants.

## Requirements Advanced

None.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

None from plan. Minor test authoring fix in T04: removed a key from application.json fixture that was shadowing the fallback assertion.

## Known Limitations

DotEnvParser v1 does not support multiline values (backslash-continuation or newlines inside double quotes) or variable interpolation ($VAR / ${VAR}).

## Follow-ups

None.

## Files Created/Modified

- `packages/config/DotEnvParser.js` — New .env file parser: bare, export-prefixed, double/single-quoted, inline comments, escape sequences
- `packages/config/test/DotEnvParser.spec.js` — 28 unit tests covering all DotEnvParser format rules
- `packages/config/ProfileConfigLoader.js` — Added DotEnvParser import and _loadEnvFiles(); restructured load() to insert .env sources between process.env and profile config files
- `packages/config/index.js` — Added DotEnvParser export
- `packages/config/test/ProfileConfigLoader.spec.js` — Extended with 8 .env integration tests including full 7-layer precedence chain
