/**
 * AzureFunctionAdapter — CDI-managed Azure Functions handler.
 *
 * Boots CDI once, then dispatches Azure Functions HTTP trigger
 * requests to controller methods via the __routes convention.
 *
 * Azure Functions v4 programming model:
 *   app.http('functionName', { methods: ['GET'], route: 'path', handler })
 *   handler(request, context) → { status, jsonBody, headers }
 *
 * The adapter simulates this by matching method + route against __routes.
 * In production, each route would be registered as a separate Azure Function
 * or dispatched through a single catch-all proxy function.
 */

export default class AzureFunctionAdapter {
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
   * Handle an Azure Functions HTTP trigger request.
   *
   * @param {object} azureRequest — Azure HttpRequest-like object
   *   { method, url, params, query, body, headers }
   * @param {object} [invocationContext] — Azure InvocationContext
   * @returns {Promise<{ status: number, jsonBody?: *, headers?: object }>}
   */
  async handle(azureRequest, invocationContext = {}) {
    const method = azureRequest.method?.toUpperCase() || 'GET';
    const url = azureRequest.url || '/';
    const path = url.startsWith('http') ? new URL(url).pathname : url;

    const match = this._matchRoute(method, path);

    if (!match) {
      return {
        status: 404,
        jsonBody: { error: `Not found: ${method} ${path}` },
        headers: { 'Content-Type': 'application/json' },
      };
    }

    const request = {
      params: { ...(azureRequest.params || {}), ...match.params },
      query: azureRequest.query || {},
      headers: azureRequest.headers || {},
      body: azureRequest.body,
      invocationContext,
      ctx: this._applicationContext,
    };

    try {
      const result = await match.handler(request);
      return this._toResponse(result);
    } catch (err) {
      return {
        status: err.statusCode || 500,
        jsonBody: { error: err.message },
        headers: { 'Content-Type': 'application/json' },
      };
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
      return { status: 204, headers: { 'Content-Type': 'application/json' } };
    }
    if (result.statusCode !== undefined) {
      return {
        status: result.statusCode,
        jsonBody: result.body !== undefined ? result.body : undefined,
        headers: { 'Content-Type': 'application/json', ...(result.headers || {}) },
      };
    }
    return {
      status: 200,
      jsonBody: result,
      headers: { 'Content-Type': 'application/json' },
    };
  }
}
