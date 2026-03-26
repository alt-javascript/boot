/**
 * ErrorHandlerMiddleware — converts unhandled exceptions to structured responses.
 *
 * Wraps the remainder of the pipeline in a try/catch. Any thrown error becomes:
 *   { statusCode: err.statusCode || 500, body: { error: err.message } }
 *
 * Runs at order 20 — inside RequestLoggerMiddleware, outside NotFoundMiddleware.
 * This placement means:
 *   - RequestLoggerMiddleware (10) still logs errors (it re-throws after logging)
 *   - ErrorHandlerMiddleware (20) catches and normalises before logging completes
 *
 * CDI opt-in: static __middleware = { order: 20 }
 *
 * Config:
 *   middleware.errorHandler.enabled — set to false to disable (default: true)
 */
export default class ErrorHandlerMiddleware {
  static __middleware = { order: 20 };

  constructor() {
    this._applicationContext = null;
  }

  setApplicationContext(ctx) {
    this._applicationContext = ctx;
  }

  get _logger() {
    try {
      return this._applicationContext?.get('logger', null);
    } catch {
      return null;
    }
  }

  _isEnabled() {
    try {
      const config = this._applicationContext?.config;
      if (config?.has('middleware.errorHandler.enabled')) {
        const val = config.get('middleware.errorHandler.enabled');
        return val !== false && val !== 'false';
      }
    } catch {
      // ignore config errors
    }
    return true;
  }

  async handle(request, next) {
    if (!this._isEnabled()) {
      return next(request);
    }

    try {
      return await next(request);
    } catch (err) {
      const statusCode = err.statusCode || 500;
      this._logger?.error(`Unhandled error (${statusCode}): ${err.message}`);
      return {
        statusCode,
        body: { error: err.message },
      };
    }
  }
}
