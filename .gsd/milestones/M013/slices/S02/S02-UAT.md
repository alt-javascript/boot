# S02: Built-in Middleware \u2014 Logger, ErrorHandler, NotFound — UAT

**Milestone:** M013
**Written:** 2026-03-26T11:54:58.209Z

## UAT — S02: Built-in Middleware\n\n### RequestLoggerMiddleware\n- ✅ Logs `[GET] /path → 200 (Xms)` on success\n- ✅ Logs error and re-throws on failure\n- ✅ Disabled via `middleware.requestLogger.enabled: false`\n\n### ErrorHandlerMiddleware\n- ✅ Converts thrown Error to `{ statusCode: 500, body: { error } }`\n- ✅ Respects `err.statusCode` (e.g. 403, 404)\n- ✅ Disabled via `middleware.errorHandler.enabled: false`\n\n### NotFoundMiddleware\n- ✅ Passes through non-null responses\n- ✅ Converts `null`/`undefined` to `{ statusCode: 404, body: { error: 'Not found' } }`\n- ✅ Disabled via `middleware.notFound.enabled: false`\n\n**Status:** ✅ 39 unit tests passing
