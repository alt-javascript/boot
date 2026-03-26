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
 * When a middleware pipeline is provided, each declarative route handler is
 * wrapped so the pipeline runs around every handler invocation.
 */
import MiddlewarePipeline from '@alt-javascript/boot/MiddlewarePipeline.js';

export default class FastifyControllerRegistrar {
  static routeCount = 0;

  /**
   * Scan all CDI components and register routes on the Fastify instance.
   *
   * @param {import('fastify').FastifyInstance} fastify
   * @param {ApplicationContext} appCtx
   * @param {Array} [middlewares] — sorted CDI middleware instances
   */
  static register(fastify, appCtx, middlewares = []) {
    FastifyControllerRegistrar.routeCount = 0;
    const components = appCtx.components;

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

          const boundHandler = instance[handler].bind(instance);

          fastify[httpMethod](path, async (fRequest, reply) => {
            let body = undefined;
            if (fRequest.headers['content-type']?.includes('application/json')) {
              body = fRequest.body;
            }

            const request = {
              method: fRequest.method,
              path: fRequest.url.split('?')[0],
              params: fRequest.params,
              query: fRequest.query,
              headers: fRequest.headers,
              body,
              ctx: appCtx,
              fastifyRequest: fRequest,
              reply,
            };

            const dispatch = async (r) => {
              const result = await boundHandler(r.fastifyRequest ?? fRequest, reply);
              if (result === null || result === undefined) return { statusCode: 204 };
              return result;
            };

            const result = await MiddlewarePipeline.compose(middlewares, dispatch)(request);

            if (result === null || result === undefined) {
              return reply.code(204).send('');
            }
            if (result.statusCode !== undefined) {
              return reply.code(result.statusCode).send(
                result.body !== undefined ? result.body : '',
              );
            }
            return reply.send(result);
          });

          FastifyControllerRegistrar.routeCount++;
        }
      }

      // Pattern 2: imperative routes(fastify, ctx)
      if (typeof instance.routes === 'function' && !Reference?.__routes) {
        instance.routes(fastify, appCtx);
      }
    }
  }
}
