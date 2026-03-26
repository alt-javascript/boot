/**
 * NotFoundMiddleware — converts unmatched routes to a consistent 404 response.
 *
 * Runs innermost of the three built-in middleware (order: 30), just outside
 * the actual route dispatcher (the finalHandler). If the finalHandler returns
 * null or undefined (no route matched), this converts to:
 *   { statusCode: 404, body: { error: 'Not found' } }
 *
 * CDI opt-in: static __middleware = { order: 30 }
 *
 * Config:
 *   middleware.notFound.enabled — set to false to disable (default: true)
 */
export default class NotFoundMiddleware {
  static __middleware = { order: 30 };

  constructor() {
    this._applicationContext = null;
  }

  setApplicationContext(ctx) {
    this._applicationContext = ctx;
  }

  _isEnabled() {
    try {
      const config = this._applicationContext?.config;
      if (config?.has('middleware.notFound.enabled')) {
        const val = config.get('middleware.notFound.enabled');
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

    const result = await next(request);

    if (result === null || result === undefined) {
      return {
        statusCode: 404,
        body: { error: 'Not found' },
      };
    }

    return result;
  }
}
