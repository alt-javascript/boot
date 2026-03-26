/**
 * RequestLoggerMiddleware — per-request structured logging.
 *
 * Logs method, path, status code, and duration on every request.
 * Runs outermost (order: 10) so it wraps everything including error handling.
 *
 * CDI opt-in: static __middleware = { order: 10 }
 *
 * Config:
 *   middleware.requestLogger.enabled — set to false to disable (default: true)
 */
export default class RequestLoggerMiddleware {
  static __middleware = { order: 10 };

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
      if (config?.has('middleware.requestLogger.enabled')) {
        const val = config.get('middleware.requestLogger.enabled');
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

    const method = request.method || (request.rawEvent?.requestContext?.http?.method) || '?';
    const path = request.path || request.rawEvent?.rawPath || request.url || '?';
    const start = Date.now();

    try {
      const result = await next(request);
      const status = result?.statusCode ?? 200;
      const duration = Date.now() - start;
      this._logger?.verbose(`[${method}] ${path} → ${status} (${duration}ms)`);
      return result;
    } catch (err) {
      const duration = Date.now() - start;
      this._logger?.error(`[${method}] ${path} → ERROR (${duration}ms): ${err.message}`);
      throw err;
    }
  }
}
