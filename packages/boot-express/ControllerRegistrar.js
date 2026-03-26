/**
 * ControllerRegistrar — scans CDI components for route metadata and registers them.
 *
 * Two patterns supported:
 *
 * 1. Declarative: static __routes metadata on the component class
 *    class UserController {
 *      static __routes = [
 *        { method: 'GET', path: '/users', handler: 'list' },
 *      ];
 *    }
 *
 * 2. Imperative: routes(app, ctx) method on the component instance
 *    class UserController {
 *      routes(app, ctx) {
 *        app.get('/users', (req, res) => this.list(req, res));
 *      }
 *    }
 *
 * When a middleware pipeline is provided, each declarative route handler is
 * wrapped so the pipeline runs around every handler invocation.
 */
import MiddlewarePipeline from '@alt-javascript/boot/MiddlewarePipeline.js';

export default class ControllerRegistrar {
  static routeCount = 0;

  /**
   * Scan all CDI components and register routes on the Express app.
   *
   * @param {express.Application} app
   * @param {ApplicationContext} ctx
   * @param {Array} [middlewares] — sorted CDI middleware instances (from MiddlewarePipeline.collect)
   */
  static register(app, ctx, middlewares = []) {
    ControllerRegistrar.routeCount = 0;
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

          const boundHandler = instance[handler].bind(instance);

          // Build the pipeline-wrapped Express route handler
          app[httpMethod](path, async (req, res, next) => {
            const request = {
              method: req.method,
              path: req.path,
              params: req.params,
              query: req.query,
              headers: req.headers,
              body: req.body,
              ctx,
              req,
              res,
            };

            try {
              // Inner dispatch: call the controller handler
              const dispatch = async (r) => {
                const result = await boundHandler(r.req ?? req, r.res ?? res, next);
                if (result === null || result === undefined) return { statusCode: 204 };
                return result;
              };

              const result = await MiddlewarePipeline.compose(middlewares, dispatch)(request);

              // If the handler already wrote the response directly (Express style), skip
              if (res.headersSent) return;

              if (result === null || result === undefined) {
                return res.status(204).send('');
              }
              if (result.statusCode !== undefined) {
                res.status(result.statusCode);
                if (result.body !== undefined) {
                  return res.json(result.body);
                }
                return res.send('');
              }
              return res.json(result);
            } catch (err) {
              next(err);
            }
          });

          ControllerRegistrar.routeCount++;
        }
      }

      // Pattern 2: imperative routes(app, ctx)
      if (typeof instance.routes === 'function' && !Reference?.__routes) {
        instance.routes(app, ctx);
      }
    }
  }
}
