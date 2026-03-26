# S01: DotEnvParser + ProfileConfigLoader .env integration

**Goal:** Implement DotEnvParser, wire it into ProfileConfigLoader at the correct precedence slot, and prove the full chain with tests.
**Demo:** After this: ProfileConfigLoader.load() resolves values from application.env with relaxed binding; process.env beats .env; profile .env beats base .env; all existing tests still green.

## Tasks
- [x] **T01: DotEnvParser.js implemented with full .env format support** — Implement DotEnvParser.js in packages/config/. Format rules: blank/comment lines, KEY=VALUE, export KEY=VALUE, double-quoted (with escapes), single-quoted (no escapes), inline comments on unquoted values, empty values. No multiline. Output: flat object suitable for EnvPropertySource.
  - Estimate: 45min
  - Files: packages/config/DotEnvParser.js
  - Verify: Read the file and confirm class is exported and handles all documented cases.
- [x] **T02: DotEnvParser unit tests written and passing (28 cases, 156 total)** — Write test/DotEnvParser.spec.js covering all parser rules. Run npm test from packages/config — all tests green.
  - Estimate: 30min
  - Files: packages/config/test/DotEnvParser.spec.js
  - Verify: cd packages/config && npm test — all tests pass, DotEnvParser suite included
- [x] **T03: .env files wired into ProfileConfigLoader at correct precedence slot** — Modify ProfileConfigLoader to discover and load .env files, wrapping them in EnvPropertySource. Insert at correct precedence slot. Export DotEnvParser from index.js.
  - Estimate: 30min
  - Files: packages/config/ProfileConfigLoader.js, packages/config/index.js, packages/config/DotEnvParser.js
  - Verify: cd packages/config && npm test — all existing tests still pass
- [x] **T04: 7-layer precedence integration tests written and passing (164 total)** — Extend test/ProfileConfigLoader.spec.js with .env-specific integration cases covering all 7 precedence layers.
  - Estimate: 30min
  - Files: packages/config/test/ProfileConfigLoader.spec.js
  - Verify: cd packages/config && npm test — all tests (old + new) pass
