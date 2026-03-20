/**
 * FastifyControllerRegistrar — scans CDI components for route metadata
 * and registers them on the Fastify instance.
 *
 * Two patterns supported (same convention as boot-express):
 *
 * 1. Declarative: static __routes metadata on the component class
 *    class UserController {
 *      static __routes = [
 *        { method: 'GET', path: '/users', handler: 'list' },
 *      ];
 *    }
 *
 * 2. Imperative: routes(fastify, ctx) method on the component instance
 *    class UserController {
 *      routes(fastify, ctx) {
 *        fastify.get('/users', async (request, reply) => { ... });
 *      }
 *    }
 *
 * Note: Fastify handlers receive (request, reply) not (req, res).
 */
export default class FastifyControllerRegistrar {
  static routeCount = 0;

  /**
   * Scan all CDI components and register routes on the Fastify instance.
   *
   * @param {import('fastify').FastifyInstance} fastify
   * @param {ApplicationContext} ctx
   */
  static register(fastify, ctx) {
    FastifyControllerRegistrar.routeCount = 0;
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
          const httpMethod = method.toLowerCase();

          if (typeof instance[handler] !== 'function') {
            throw new Error(
              `Controller (${name}) declares route ${method} ${path} → ${handler}() but the method does not exist`,
            );
          }

          // Bind handler to instance so 'this' works
          const boundHandler = instance[handler].bind(instance);

          fastify[httpMethod](path, async (request, reply) => boundHandler(request, reply));

          FastifyControllerRegistrar.routeCount++;
        }
      }

      // Pattern 2: imperative routes(fastify, ctx)
      if (typeof instance.routes === 'function' && !Reference?.__routes) {
        instance.routes(fastify, ctx);
      }
    }
  }
}
