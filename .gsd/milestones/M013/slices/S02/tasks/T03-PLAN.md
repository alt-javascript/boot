---
estimated_steps: 13
estimated_files: 1
skills_used: []
---

# T03: Unit tests for the three built-in middleware

Create packages/boot/test/middleware.spec.js covering all three middleware:

RequestLoggerMiddleware:
- calls next and returns its result
- logs method/path/status/duration (mock logger captured via setApplicationContext)
- re-throws if next throws (after logging)

ErrorHandlerMiddleware:
- passes through when next succeeds
- catches thrown error, returns { statusCode: err.statusCode || 500, body: { error: err.message } }
- uses err.statusCode when present (e.g. 404 from a controller throwing a structured error)

NotFoundMiddleware:
- passes through non-null results from next
- converts null result to 404
- converts undefined result to 404

## Inputs

- `packages/boot/middleware/RequestLoggerMiddleware.js`
- `packages/boot/middleware/ErrorHandlerMiddleware.js`
- `packages/boot/middleware/NotFoundMiddleware.js`

## Expected Output

- `packages/boot/test/middleware.spec.js`

## Verification

cd packages/boot && npm test 2>&1 | grep -E 'passing|failing|middleware'
