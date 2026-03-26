---
estimated_steps: 1
estimated_files: 1
skills_used: []
---

# T04: Precedence integration tests

Extend test/ProfileConfigLoader.spec.js with .env-specific integration cases covering all 7 precedence layers.

## Inputs

- `packages/config/test/ProfileConfigLoader.spec.js`
- `packages/config/ProfileConfigLoader.js`

## Expected Output

- `packages/config/test/ProfileConfigLoader.spec.js (extended)`

## Verification

cd packages/config && npm test — all tests (old + new) pass
