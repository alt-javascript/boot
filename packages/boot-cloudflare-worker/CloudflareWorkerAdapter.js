/**
 * CloudflareWorkerAdapter — CDI-managed Cloudflare Workers handler.
 *
 * Boots CDI once, then dispatches incoming fetch events through the CDI
 * middleware pipeline to controller methods via the __routes convention.
 * Returns Web Standards Response objects.
 *
 * Cloudflare Workers handler signature:
 *   export default { fetch(request, env, ctx) { ... } }
 */
import MiddlewarePipeline from '@alt-javascript/boot/MiddlewarePipeline.js';

export default class CloudflareWorkerAdapter {
  constructor(applicationContext) {
    this._applicationContext = applicationContext;
    this._routes = new Map();
    this._buildRoutes();

    // Collect CDI middleware instances sorted by __middleware.order
    this._middlewares = MiddlewarePipeline.collect(applicationContext);
  }

  get applicationContext() {
    return this._applicationContext;
  }

  get routeCount() {
    return this._routes.size;
  }

  _buildRoutes() {
    const components = this._applicationContext.components;

    for (const name of Object.keys(components)) {
      const component = components[name];
      if (!component.instance) continue;

      const instance = component.instance;
      const Reference = component.Reference;

      if (Reference && Reference.__routes && Array.isArray(Reference.__routes)) {
        for (const route of Reference.__routes) {
          const { method, path, handler } = route;

          if (typeof instance[handler] !== 'function') {
            throw new Error(
              `Controller (${name}) declares route ${method} ${path} → ${handler}() but the method does not exist`,
            );
          }

          const routeKey = `${method.toUpperCase()} ${path}`;
          this._routes.set(routeKey, {
            handler: instance[handler].bind(instance),
            pattern: path,
          });
        }
      }

      if (typeof instance.routes === 'function' && !Reference?.__routes) {
        instance.routes(this._routes, this._applicationContext);
      }
    }
  }

  /**
   * Handle a Cloudflare Workers fetch event.
   *
   * @param {Request} webRequest — Web Standards Request
   * @param {object} [env] — Cloudflare env bindings
   * @param {object} [workerCtx] — Cloudflare execution context
   * @returns {Promise<Response>} Web Standards Response
   */
  async fetch(webRequest, env = {}, workerCtx = {}) {
    const url = new URL(webRequest.url);
    const method = webRequest.method;
    const path = url.pathname;

    let body = undefined;
    const contentType = webRequest.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        body = await webRequest.json();
      } catch {
        body = await webRequest.text();
      }
    }

    const request = {
      method,
      path,
      params: {},
      query: Object.fromEntries(url.searchParams.entries()),
      headers: Object.fromEntries(webRequest.headers.entries()),
      body,
      env,
      workerCtx,
      ctx: this._applicationContext,
      rawRequest: webRequest,
    };

    const result = await MiddlewarePipeline.compose(
      this._middlewares,
      this._dispatch.bind(this),
    )(request);

    return this._toResponse(result);
  }

  /**
   * Dispatch to the matching controller handler.
   * Returns null when no route matches (NotFoundMiddleware converts to 404).
   */
  async _dispatch(request) {
    const match = this._matchRoute(request.method, request.path);
    if (!match) return null; // NotFoundMiddleware converts to 404
    request.params = match.params;
    const result = await match.handler(request);
    // Handler returned nothing → 204 No Content
    if (result === null || result === undefined) return { statusCode: 204 };
    return result;
  }

  _matchRoute(method, path) {
    for (const [key, route] of this._routes) {
      const [routeMethod, routePath] = key.split(' ');
      if (routeMethod !== method) continue;

      const match = this._matchPath(routePath, path);
      if (match) return { handler: route.handler, params: match.params };
    }
    return null;
  }

  _matchPath(pattern, path) {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');
    if (patternParts.length !== pathParts.length) return null;

    const params = {};
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = pathParts[i];
      } else if (patternParts[i] !== pathParts[i]) {
        return null;
      }
    }
    return { params };
  }

  _toResponse(result) {
    if (result === null || result === undefined) {
      // null from _dispatch means no route matched; produce 404 directly
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (result.statusCode !== undefined) {
      const noBody = result.statusCode === 204 || result.statusCode === 304;
      const responseBody = noBody
        ? null
        : (result.body !== undefined
          ? (typeof result.body === 'string' ? result.body : JSON.stringify(result.body))
          : '');
      return new Response(responseBody, {
        status: result.statusCode,
        headers: { 'Content-Type': 'application/json', ...(result.headers || {}) },
      });
    }
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
