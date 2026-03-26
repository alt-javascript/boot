---
estimated_steps: 3
estimated_files: 2
skills_used: []
---

# T02: Add AuthMiddleware to example-3-1 (Lambda)

Add an AuthMiddleware CDI component to example-3-1 (Lambda).

Same pattern as Express example — the same AuthMiddleware class works identically because the normalised request shape is consistent across adapters.

Add a protected route to the Lambda controller. Update README.

## Inputs

- `packages/example-3-1-serverless-lambda/index.js`
- `packages/boot-lambda/index.js`

## Expected Output

- `packages/example-3-1-serverless-lambda/middleware/AuthMiddleware.js`
- `packages/example-3-1-serverless-lambda/README.md (updated)`

## Verification

ls packages/example-3-1-serverless-lambda/middleware/AuthMiddleware.js
