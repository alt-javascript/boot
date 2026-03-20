/**
 * KoaControllerRegistrar — scans CDI components for route metadata
 * and builds a method+path → handler map for Koa dispatch.
 *
 * Same __routes convention as all other adapters.
 * Routes are stored as "METHOD /path" keys in a Map.
 */
export default class KoaControllerRegistrar {
  static routeCount = 0;

  static register(routes, ctx) {
    KoaControllerRegistrar.routeCount = 0;
    const components = ctx.components;

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
          routes.set(routeKey, { handler: instance[handler].bind(instance) });
          KoaControllerRegistrar.routeCount++;
        }
      }

      if (typeof instance.routes === 'function' && !Reference?.__routes) {
        instance.routes(routes, ctx);
      }
    }
  }
}
