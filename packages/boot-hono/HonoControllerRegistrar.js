/**
 * HonoControllerRegistrar — scans CDI components for route metadata
 * and registers them on the Hono app using Hono's native routing.
 *
 * When a middleware pipeline is provided, each declarative route handler is
 * wrapped so the pipeline runs around every handler invocation.
 */
import MiddlewarePipeline from '@alt-javascript/boot/MiddlewarePipeline.js';

export default class HonoControllerRegistrar {
  static routeCount = 0;

  /**
   * @param {import('hono').Hono} app
   * @param {ApplicationContext} appCtx
   * @param {Array} [middlewares] — sorted CDI middleware instances
   */
  static register(app, appCtx, middlewares = []) {
    HonoControllerRegistrar.routeCount = 0;
    const components = appCtx.components;

    for (const name of Object.keys(components)) {
      const component = components[name];
      if (!component.instance) continue;

      const instance = component.instance;
      const Reference = component.Reference;

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

          app[httpMethod](path, async (c) => {
            let body = undefined;
            if (c.req.header('content-type')?.includes('application/json')) {
              try {
                body = await c.req.json();
              } catch {
                body = await c.req.text();
              }
            }

            const request = {
              method: c.req.method,
              path: new URL(c.req.url).pathname,
              params: c.req.param(),
              query: c.req.query(),
              headers: Object.fromEntries(c.req.raw.headers.entries()),
              body,
              ctx: appCtx,
              honoCtx: c,
            };

            const dispatch = async (r) => {
              const result = await boundHandler(r);
              if (result === null || result === undefined) return { statusCode: 204 };
              return result;
            };

            const result = await MiddlewarePipeline.compose(middlewares, dispatch)(request);

            if (result === null || result === undefined) {
              return c.body('', 204);
            }
            if (result.statusCode !== undefined) {
              return c.json(result.body !== undefined ? result.body : '', result.statusCode);
            }
            return c.json(result);
          });

          HonoControllerRegistrar.routeCount++;
        }
      }

      if (typeof instance.routes === 'function' && !Reference?.__routes) {
        instance.routes(app, appCtx);
      }
    }
  }
}
