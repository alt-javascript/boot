/**
 * CloudflareWorkerAdapter — CDI-managed Cloudflare Workers handler.
 *
 * Boots CDI once, then dispatches incoming fetch events to controller
 * methods via the same __routes convention. Returns Web Standards
 * Response objects.
 *
 * Cloudflare Workers handler signature:
 *   export default { fetch(request, env, ctx) { ... } }
 *
 * `env` carries secrets and bindings (KV, D1, etc.) — surfaced to
 * controllers via request.env. Config values can be seeded from env
 * at boot time.
 */

export default class CloudflareWorkerAdapter {
  constructor(applicationContext) {
    this._applicationContext = applicationContext;
    this._routes = new Map();
    this._buildRoutes();
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
   * @param {object} [env] — Cloudflare env bindings (secrets, KV, D1)
   * @param {object} [workerCtx] — Cloudflare execution context (waitUntil, etc.)
   * @returns {Promise<Response>} Web Standards Response
   */
  async fetch(webRequest, env = {}, workerCtx = {}) {
    const url = new URL(webRequest.url);
    const method = webRequest.method;
    const path = url.pathname;

    const match = this._matchRoute(method, path);

    if (!match) {
      return new Response(JSON.stringify({ error: `Not found: ${method} ${path}` }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

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
      params: match.params,
      query: Object.fromEntries(url.searchParams.entries()),
      headers: Object.fromEntries(webRequest.headers.entries()),
      body,
      env,
      workerCtx,
      ctx: this._applicationContext,
      rawRequest: webRequest,
    };

    try {
      const result = await match.handler(request);
      return this._toResponse(result);
    } catch (err) {
      const status = err.statusCode || 500;
      return new Response(JSON.stringify({ error: err.message }), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
    }
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
      return new Response('', { status: 204 });
    }
    if (result.statusCode !== undefined) {
      const body = result.body !== undefined
        ? (typeof result.body === 'string' ? result.body : JSON.stringify(result.body))
        : '';
      return new Response(body, {
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
