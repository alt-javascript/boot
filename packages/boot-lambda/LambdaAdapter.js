/**
 * LambdaAdapter — CDI-managed AWS Lambda handler.
 *
 * Boots the ApplicationContext once on cold start, then dispatches
 * API Gateway HTTP API v2 events through the CDI middleware pipeline
 * to controller methods via the `__routes` convention.
 *
 * The middleware pipeline (ErrorHandlerMiddleware, NotFoundMiddleware,
 * RequestLoggerMiddleware, etc.) is composed from CDI components that
 * declare `static __middleware = { order: N }`. Custom middleware simply
 * needs to be registered in the CDI context.
 */
import MiddlewarePipeline from '@alt-javascript/boot/MiddlewarePipeline.js';
import LambdaControllerRegistrar from './LambdaControllerRegistrar.js';

export default class LambdaAdapter {
  /**
   * @param {ApplicationContext} applicationContext — the CDI context (booted)
   */
  constructor(applicationContext) {
    this._applicationContext = applicationContext;
    this._routes = new Map();
    this._registrar = new LambdaControllerRegistrar();

    // Build the route table from CDI components
    this._registrar.register(this._routes, applicationContext);

    // Collect CDI middleware instances sorted by __middleware.order
    this._middlewares = MiddlewarePipeline.collect(applicationContext);
  }

  /** @returns {ApplicationContext} */
  get applicationContext() {
    return this._applicationContext;
  }

  /** @returns {number} registered route count */
  get routeCount() {
    return this._routes.size;
  }

  /**
   * Handle an API Gateway HTTP API v2 event.
   *
   * Builds a normalised request, runs it through the CDI middleware pipeline,
   * then serialises the result into the Lambda response format.
   *
   * @param {object} event — API Gateway v2 event
   * @param {object} lambdaContext — AWS Lambda context
   * @returns {Promise<{statusCode: number, body: string, headers: object}>}
   */
  async handle(event, lambdaContext) {
    const headers = { 'Content-Type': 'application/json' };

    const routeKey = event.routeKey;
    if (!routeKey) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing routeKey' }), headers };
    }

    // Parse JSON body if present
    let parsedBody = undefined;
    if (event.body) {
      try {
        parsedBody = event.isBase64Encoded
          ? JSON.parse(Buffer.from(event.body, 'base64').toString('utf-8'))
          : JSON.parse(event.body);
      } catch {
        parsedBody = event.body;
      }
    }

    const request = {
      method: event.requestContext?.http?.method || routeKey.split(' ')[0],
      path: event.requestContext?.http?.path || routeKey.split(' ')[1],
      params: event.pathParameters || {},
      query: event.queryStringParameters || {},
      headers: event.headers || {},
      body: parsedBody,
      rawEvent: event,
      lambdaContext,
      ctx: this._applicationContext,
    };

    // Run through the CDI middleware pipeline; _dispatch is the innermost handler
    const result = await MiddlewarePipeline.compose(
      this._middlewares,
      this._dispatch.bind(this),
    )(request);

    return this._normalizeResponse(result, headers);
  }

  /**
   * Dispatch a request to the matching controller handler.
   * Returns null when no route matches (NotFoundMiddleware converts to 404).
   *
   * @param {object} request
   * @returns {Promise<*|null>}
   */
  async _dispatch(request) {
    const route = this._matchRoute(request.rawEvent.routeKey);
    if (!route) return null; // NotFoundMiddleware converts this to 404
    const result = await route.handler(request);
    // Handler returned nothing → 204 No Content (route matched, nothing to return)
    if (result === null || result === undefined) return { statusCode: 204 };
    return result;
  }

  /**
   * Match a routeKey to a registered route.
   *
   * @param {string} routeKey — e.g. "GET /todos/{id}"
   * @returns {{ handler: Function }|null}
   */
  _matchRoute(routeKey) {
    if (this._routes.has(routeKey)) {
      return this._routes.get(routeKey);
    }
    return null;
  }

  /**
   * Normalise a handler / pipeline return value into Lambda response format.
   *
   * @param {*} result
   * @param {object} defaultHeaders
   * @returns {{ statusCode: number, body: string, headers: object }}
   */
  _normalizeResponse(result, defaultHeaders) {
    if (result === null || result === undefined) {
      return { statusCode: 204, body: '', headers: defaultHeaders };
    }

    if (result.statusCode !== undefined) {
      return {
        statusCode: result.statusCode,
        body: typeof result.body === 'string' ? result.body : JSON.stringify(result.body ?? ''),
        headers: { ...defaultHeaders, ...(result.headers || {}) },
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result),
      headers: defaultHeaders,
    };
  }
}
