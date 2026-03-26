---
estimated_steps: 7
estimated_files: 2
skills_used: []
---

# T01: Add AuthMiddleware to example-2-1 (Express)

Add an AuthMiddleware CDI component to example-2-1 (Express). Show the pattern concisely.

Steps:
1. Add middleware/AuthMiddleware.js to example-2-1
2. Register it in the CDI context (it replaces or supplements expressStarter middleware)
3. Add a protected route to the existing controller that requires a Bearer token
4. Update README with a 1-paragraph explanation of the middleware pattern

AuthMiddleware checks Authorization: Bearer <token> header. If missing or invalid, returns 401. Otherwise attaches user info to request and calls next.

## Inputs

- `packages/example-2-1-servers-express/index.js`
- `packages/boot-express/index.js`
- `packages/boot/middleware/index.js`

## Expected Output

- `packages/example-2-1-servers-express/middleware/AuthMiddleware.js`
- `packages/example-2-1-servers-express/README.md (updated)`

## Verification

ls packages/example-2-1-servers-express/middleware/AuthMiddleware.js && node --input-type=module -e "import './packages/example-2-1-servers-express/middleware/AuthMiddleware.js'; console.log('ok');"
