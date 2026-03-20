/**
 * LambdaAdapter — CDI-managed AWS Lambda handler.
 *
 * Boots the ApplicationContext once on cold start, then dispatches
 * API Gateway HTTP API v2 events to CDI controller methods via
 * the same `__routes` convention used by Express and Fastify adapters.
 *
 * Usage:
 *   import { createLambdaHandler } from '@alt-javascript/boot-lambda';
 *
 *   const handler = createLambdaHandler({
 *     contexts: [new Context([...myComponents])],
 *     config,
 *   });
 *
 *   export { handler };
 *
 * The handler function has the signature `(event, lambdaContext) => Promise<Response>`
 * expected by the AWS Lambda runtime.
 */
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
   * @param {object} event — API Gateway v2 event
   * @param {object} lambdaContext — AWS Lambda context (timeout, requestId, etc.)
   * @returns {Promise<{statusCode: number, body: string, headers: object}>}
   */
  async handle(event, lambdaContext) {
    const headers = { 'Content-Type': 'application/json' };

    try {
      const routeKey = event.routeKey;

      if (!routeKey) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing routeKey' }), headers };
      }

      // Find matching route
      const route = this._matchRoute(routeKey);

      if (!route) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: `No route matches: ${routeKey}` }),
          headers,
        };
      }

      // Parse JSON body if present
      let parsedBody = undefined;
      if (event.body) {
        try {
          parsedBody = event.isBase64Encoded
            ? JSON.parse(Buffer.from(event.body, 'base64').toString('utf-8'))
            : JSON.parse(event.body);
        } catch {
          // Leave as raw string if not valid JSON
          parsedBody = event.body;
        }
      }

      // Build a request-like object for the controller
      const request = {
        params: event.pathParameters || {},
        query: event.queryStringParameters || {},
        headers: event.headers || {},
        body: parsedBody,
        rawEvent: event,
        lambdaContext,
        ctx: this._applicationContext,
      };

      // Call the controller handler
      const result = await route.handler(request);

      // Normalize the response
      return this._normalizeResponse(result, headers);
    } catch (err) {
      const statusCode = err.statusCode || 500;
      return {
        statusCode,
        body: JSON.stringify({ error: err.message }),
        headers,
      };
    }
  }

  /**
   * Match a routeKey to a registered route.
   *
   * Supports exact matches ("GET /todos") and parameterised matches
   * ("GET /todos/{id}" matches "GET /todos/123").
   *
   * @param {string} routeKey — e.g. "GET /todos/{id}"
   * @returns {{ handler: Function }|null}
   */
  _matchRoute(routeKey) {
    // Exact match first (API Gateway sends the template routeKey, not the resolved path)
    if (this._routes.has(routeKey)) {
      return this._routes.get(routeKey);
    }

    // No match
    return null;
  }

  /**
   * Normalize a handler return value into Lambda response format.
   *
   * Handlers can return:
   * - A plain object → 200 + JSON.stringify
   * - { statusCode, body, headers } → pass through
   * - null/undefined → 204 No Content
   *
   * @param {*} result
   * @param {object} defaultHeaders
   * @returns {{ statusCode: number, body: string, headers: object }}
   */
  _normalizeResponse(result, defaultHeaders) {
    if (result === null || result === undefined) {
      return { statusCode: 204, body: '', headers: defaultHeaders };
    }

    // If the handler returned a full Lambda response object
    if (result.statusCode !== undefined) {
      return {
        statusCode: result.statusCode,
        body: typeof result.body === 'string' ? result.body : JSON.stringify(result.body),
        headers: { ...defaultHeaders, ...(result.headers || {}) },
      };
    }

    // Plain object → 200 JSON
    return {
      statusCode: 200,
      body: JSON.stringify(result),
      headers: defaultHeaders,
    };
  }
}
