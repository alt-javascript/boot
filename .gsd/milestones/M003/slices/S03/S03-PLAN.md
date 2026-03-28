# S03: Config Package Refactoring

**Goal:** New `PropertySourceConfig` implementation following Spring's externalized configuration model — profile-aware file loading (JSON/YAML/properties), `process.env` injection, layered precedence, and `NODE_ACTIVE_PROFILES` to select profile-specific config files.
**Demo:** After this: config package internals are cleaner — reduced class count, consistent patterns, no behavior changes; all 44 config tests pass

## Tasks
- [x] **T01: Java properties file parser** — 
  - Files: packages/config/PropertiesParser.js, packages/config/test/PropertiesParser.spec.js
  - Verify: Unit tests for all notation forms
- [x] **T02: PropertySourceChain — layered config with precedence** — 
  - Files: packages/config/PropertySourceChain.js
  - Verify: Unit tests for precedence ordering, env binding
- [x] **T03: Profile-aware file loading and NODE_ACTIVE_PROFILES** — 
  - Files: packages/config/ProfileConfigLoader.js, packages/config/index.js
  - Verify: Integration test with temp config files and NODE_ACTIVE_PROFILES
- [x] **T04: Integration tests and ConfigFactory integration** — 
  - Files: packages/config/test/PropertySource.spec.js, packages/config/ConfigFactory.js
  - Verify: Full test suite green
