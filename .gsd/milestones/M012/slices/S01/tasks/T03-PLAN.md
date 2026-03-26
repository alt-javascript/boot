---
estimated_steps: 1
estimated_files: 3
skills_used: []
---

# T03: Wire .env into ProfileConfigLoader

Modify ProfileConfigLoader to discover and load .env files, wrapping them in EnvPropertySource. Insert at correct precedence slot. Export DotEnvParser from index.js.

## Inputs

- `packages/config/ProfileConfigLoader.js`
- `packages/config/EnvPropertySource.js`

## Expected Output

- `packages/config/ProfileConfigLoader.js (modified)`
- `packages/config/index.js (modified)`

## Verification

cd packages/config && npm test — all existing tests still pass
