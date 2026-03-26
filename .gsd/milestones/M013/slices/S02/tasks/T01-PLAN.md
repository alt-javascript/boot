---
estimated_steps: 17
estimated_files: 4
skills_used: []
---

# T01: Implement the three built-in middleware components

Create packages/boot/middleware/RequestLoggerMiddleware.js

- static __middleware = { order: 10 }
- Reads CDI logger via setApplicationContext / this._applicationContext
- On handle(request, next): records start time, calls next, logs: `[METHOD] path → statusCode (Xms)` at 'verbose' level
- If next throws, logs the error at 'error' level then re-throws (ErrorHandlerMiddleware catches it)
- Config flag: `middleware.requestLogger.enabled` (default true); skip install if false

Create packages/boot/middleware/ErrorHandlerMiddleware.js

- static __middleware = { order: 20 }
- On handle(request, next): wraps next in try/catch; on throw returns { statusCode: err.statusCode || 500, body: { error: err.message } }
- Logs error via CDI logger at 'error' level before returning
- Config flag: `middleware.errorHandler.enabled` (default true)

Create packages/boot/middleware/NotFoundMiddleware.js

- static __middleware = { order: 30 }
- On handle(request, next): calls next; if result is null/undefined or statusCode === 404, returns { statusCode: 404, body: { error: 'Not found' } }
- Actually: acts as innermost pre-handler — if no route matched the adapter sets a sentinel; NotFoundMiddleware produces the 404 response
- Simpler model: NotFoundMiddleware is the last in the chain (highest order), calls next; the adapter's route dispatch is the finalHandler. If no route matches, dispatch returns null and NotFoundMiddleware converts to 404.

Create packages/boot/middleware/index.js that exports all three.

## Inputs

- `packages/boot/MiddlewarePipeline.js`
- `packages/boot/index.js`

## Expected Output

- `packages/boot/middleware/RequestLoggerMiddleware.js`
- `packages/boot/middleware/ErrorHandlerMiddleware.js`
- `packages/boot/middleware/NotFoundMiddleware.js`
- `packages/boot/middleware/index.js`

## Verification

node --input-type=module -e "import { RequestLoggerMiddleware, ErrorHandlerMiddleware, NotFoundMiddleware } from './packages/boot/middleware/index.js'; console.log('ok');" 2>&1
