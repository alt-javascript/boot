/**
 * HonoControllerRegistrar — scans CDI components for route metadata
 * and registers them on the Hono app using Hono's native routing.
 *
 * Hono uses Web Standards API: handlers receive a Hono context (c)
 * and return a Response via c.json(), c.text(), etc.
 *
 * Controller handlers receive a normalized request object (same shape
 * as other adapters) and return plain objects or { statusCode, body }.
 */
export default class HonoControllerRegistrar {
  static routeCount = 0;

  static register(app, appCtx) {
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

          // Convert :param to Hono's :param format (same convention)
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
              params: c.req.param(),
              query: c.req.query(),
              headers: Object.fromEntries(c.req.raw.headers.entries()),
              body,
              ctx: appCtx,
              honoCtx: c,
            };

            try {
              const result = await boundHandler(request);

              if (result === null || result === undefined) {
                return c.body('', 204);
              }
              if (result.statusCode !== undefined) {
                return c.json(result.body !== undefined ? result.body : '', result.statusCode);
              }
              return c.json(result);
            } catch (err) {
              const status = err.statusCode || 500;
              return c.json({ error: err.message }, status);
            }
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
