# S05: Examples — Auth + Logging + Error Handling end-to-end

**Goal:** Update example-2-1 (Express server) and example-3-1 (Lambda) to demonstrate the middleware pipeline with authentication, request logging, and custom error handling. Record the architecture decision.
**Demo:** After this: README snippet showing a 10-line AuthMiddleware CDI component; curl output confirming 401/404/500 responses

## Tasks
- [x] **T01: AuthMiddleware added to Express example — protected routes, 401 on missing token** — Add an AuthMiddleware CDI component to example-2-1 (Express). Show the pattern concisely.

Steps:
1. Add middleware/AuthMiddleware.js to example-2-1
2. Register it in the CDI context (it replaces or supplements expressStarter middleware)
3. Add a protected route to the existing controller that requires a Bearer token
4. Update README with a 1-paragraph explanation of the middleware pattern

AuthMiddleware checks Authorization: Bearer <token> header. If missing or invalid, returns 401. Otherwise attaches user info to request and calls next.
  - Estimate: 45m
  - Files: packages/example-2-1-servers-express/middleware/AuthMiddleware.js, packages/example-2-1-servers-express/index.js
  - Verify: ls packages/example-2-1-servers-express/middleware/AuthMiddleware.js && node --input-type=module -e "import './packages/example-2-1-servers-express/middleware/AuthMiddleware.js'; console.log('ok');"
- [x] **T02: AuthMiddleware added to Lambda example — 7 tests passing including 401 and auth-success cases** — Add an AuthMiddleware CDI component to example-3-1 (Lambda).

Same pattern as Express example — the same AuthMiddleware class works identically because the normalised request shape is consistent across adapters.

Add a protected route to the Lambda controller. Update README.
  - Estimate: 30m
  - Files: packages/example-3-1-serverless-lambda/middleware/AuthMiddleware.js, packages/example-3-1-serverless-lambda/index.js
  - Verify: ls packages/example-3-1-serverless-lambda/middleware/AuthMiddleware.js
- [x] **T03: Architecture decision D028 recorded in DECISIONS.md** — Record the middleware architecture decision in DECISIONS.md via gsd_decision_save.
  - Estimate: 10m
  - Files: .gsd/DECISIONS.md
  - Verify: grep -c 'middleware' .gsd/DECISIONS.md
