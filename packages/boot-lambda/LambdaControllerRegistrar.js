/**
 * LambdaControllerRegistrar — scans CDI components for route metadata
 * and builds a routeKey → handler map for Lambda dispatch.
 *
 * Same `__routes` convention as Express and Fastify adapters, but routes
 * are registered as a Map keyed by API Gateway routeKey format:
 *   "GET /todos"
 *   "POST /todos"
 *   "GET /todos/{id}"
 *
 * Path format note: Express uses `:id`, Lambda/API Gateway uses `{id}`.
 * The `__routes` metadata should use the API Gateway `{param}` style
 * for Lambda controllers. If `:param` style is detected, it is
 * automatically converted.
 *
 * Two patterns supported:
 *
 * 1. Declarative: static __routes metadata
 *    class TodoController {
 *      static __routes = [
 *        { method: 'GET', path: '/todos', handler: 'list' },
 *        { method: 'GET', path: '/todos/{id}', handler: 'getById' },
 *      ];
 *    }
 *
 * 2. Imperative: routes(router) method
 *    class TodoController {
 *      routes(router) {
 *        router.set('GET /custom', { handler: (request) => ({ custom: true }) });
 *      }
 *    }
 */
export default class LambdaControllerRegistrar {
  constructor() {
    this.routeCount = 0;
  }

  /**
   * Scan CDI components and populate the route map.
   *
   * @param {Map<string, { handler: Function }>} routes — route map to populate
   * @param {ApplicationContext} ctx
   */
  register(routes, ctx) {
    this.routeCount = 0;
    const components = ctx.components;

    for (const name of Object.keys(components)) {
      const component = components[name];
      if (!component.instance) continue;

      const instance = component.instance;
      const Reference = component.Reference;

      // Pattern 1: static __routes
      if (Reference && Reference.__routes && Array.isArray(Reference.__routes)) {
        for (const route of Reference.__routes) {
          const { method, path, handler } = route;

          if (typeof instance[handler] !== 'function') {
            throw new Error(
              `Controller (${name}) declares route ${method} ${path} → ${handler}() but the method does not exist`,
            );
          }

          // Convert :param to {param} for API Gateway compatibility
          const lambdaPath = path.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, '{$1}');
          const routeKey = `${method.toUpperCase()} ${lambdaPath}`;

          const boundHandler = instance[handler].bind(instance);
          routes.set(routeKey, { handler: boundHandler });
          this.routeCount++;
        }
      }

      // Pattern 2: imperative routes(router)
      if (typeof instance.routes === 'function' && !Reference?.__routes) {
        instance.routes(routes, ctx);
      }
    }
  }
}
