---
estimated_steps: 1
estimated_files: 1
skills_used: []
---

# T02: Export MiddlewarePipeline from packages/boot

Add `export { default as MiddlewarePipeline } from './MiddlewarePipeline.js';` to packages/boot/index.js

## Inputs

- `packages/boot/index.js`
- `packages/boot/MiddlewarePipeline.js`

## Expected Output

- `packages/boot/index.js (updated)`

## Verification

node --input-type=module -e "import { MiddlewarePipeline } from './packages/boot/index.js'; console.log(typeof MiddlewarePipeline.compose);"
