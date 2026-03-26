---
id: M012
title: ".env File Support in Config Package"
status: complete
completed_at: 2026-03-25T19:42:01.822Z
key_decisions:
  - _loadEnvFiles() kept separate from _loadFiles() — .env wraps in EnvPropertySource, not EphemeralConfig
  - .env files slot below process.env (real env vars always win) and above file-based config
  - Inline comment # must be preceded by whitespace to avoid stripping embedded # in values
  - Multiline and interpolation deferred to v2
key_files:
  - packages/config/DotEnvParser.js
  - packages/config/ProfileConfigLoader.js
  - packages/config/index.js
  - packages/config/test/DotEnvParser.spec.js
  - packages/config/test/ProfileConfigLoader.spec.js
lessons_learned:
  - EnvPropertySource is the right wrapper for any env-var-style source — it delivers relaxed binding for free without duplicating the logic
  - Test fixtures for precedence layers need careful key design: each layer should own a unique key, not just override shared ones, so the fallback layer can be verified
---

# M012: .env File Support in Config Package

**Added .env file support to @alt-javascript/config with full relaxed binding, profile variants, and correct 7-layer precedence**

## What Happened

Added .env file support to @alt-javascript/config in a single focused slice. DotEnvParser handles the complete standard .env format (bare, export-prefixed, double/single-quoted, inline comments, escapes). ProfileConfigLoader discovers application.env and application-{profile}.env alongside existing formats, parses with DotEnvParser, and wraps in EnvPropertySource for identical relaxed binding to process.env. Precedence is standard dotenv: real env vars always win over file-based .env. 164 tests pass.

## Success Criteria Results

All 6 success criteria met — see VALIDATION.md for detail. Key proof: 164-test suite with full 7-layer chain integration test.

## Definition of Done Results

- ✅ DotEnvParser.js implemented and tested (28 cases)
- ✅ ProfileConfigLoader._loadEnvFiles() handles .env → EnvPropertySource
- ✅ .env sources at correct precedence slot (between process.env and profile configs)
- ✅ All 156 existing tests still pass (164 total)
- ✅ New test file packages/config/test/DotEnvParser.spec.js
- ✅ No new dependencies added

## Requirement Outcomes

No formal requirements pre-existed. All success criteria satisfied and validated.

## Deviations

None.

## Follow-ups

DotEnvParser v2 could add multiline values and $VAR interpolation if needed.
