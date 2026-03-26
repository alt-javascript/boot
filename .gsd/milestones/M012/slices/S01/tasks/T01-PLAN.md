---
estimated_steps: 1
estimated_files: 1
skills_used: []
---

# T01: Implement DotEnvParser.js

Implement DotEnvParser.js in packages/config/. Format rules: blank/comment lines, KEY=VALUE, export KEY=VALUE, double-quoted (with escapes), single-quoted (no escapes), inline comments on unquoted values, empty values. No multiline. Output: flat object suitable for EnvPropertySource.

## Inputs

- `packages/config/PropertiesParser.js`

## Expected Output

- `packages/config/DotEnvParser.js`

## Verification

Read the file and confirm class is exported and handles all documented cases.
