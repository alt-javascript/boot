/**
 * MiddlewarePipeline — framework-agnostic middleware compose utility.
 *
 * Middleware components opt in via a static class property:
 *
 *   class AuthMiddleware {
 *     static __middleware = { order: 10 };
 *     async handle(request, next) {
 *       if (!isValid(request.headers.authorization))
 *         return { statusCode: 401, body: { error: 'Unauthorized' } };
 *       return next(request);
 *     }
 *   }
 *
 * Lower order values run outermost (first in, last out), matching Express/Koa convention.
 *
 * The composed pipeline has the signature:
 *   (request) => Promise<response>
 *
 * It is pure — no framework dependency, no side effects beyond what the
 * middleware instances themselves perform.
 */
export default class MiddlewarePipeline {
  /**
   * Collect CDI middleware instances from an ApplicationContext.
   *
   * Scans all components whose class has a static `__middleware` property.
   * Returns instances sorted by ascending `__middleware.order`
   * (default: Infinity — unordered middleware goes innermost).
   *
   * @param {object} applicationContext — CDI ApplicationContext
   * @returns {Array} sorted middleware instances
   */
  static collect(applicationContext) {
    const components = applicationContext.components;
    const middlewares = [];

    for (const name of Object.keys(components)) {
      const component = components[name];
      if (!component.instance) continue;

      const Reference = component.Reference;
      if (Reference && Reference.__middleware) {
        middlewares.push({
          instance: component.instance,
          order: Reference.__middleware.order ?? Infinity,
        });
      }
    }

    // Stable sort by ascending order
    middlewares.sort((a, b) => a.order - b.order);

    return middlewares.map((m) => m.instance);
  }

  /**
   * Compose an ordered list of middleware instances around a final handler.
   *
   * Each middleware must expose a `handle(request, next)` method.
   * `next` accepts an optionally mutated request and returns the inner result.
   * Returning without calling `next` short-circuits the remainder of the chain.
   *
   * @param {Array} middlewareInstances — CDI instances with handle(request, next)
   * @param {Function} finalHandler — (request) => Promise<response>
   * @returns {Function} (request) => Promise<response>
   */
  static compose(middlewareInstances, finalHandler) {
    const chain = [...middlewareInstances];

    function dispatch(index, request) {
      if (index === chain.length) {
        return Promise.resolve(finalHandler(request));
      }

      const middleware = chain[index];

      function next(nextRequest) {
        return dispatch(index + 1, nextRequest ?? request);
      }

      return Promise.resolve(middleware.handle(request, next));
    }

    return function pipeline(request) {
      return dispatch(0, request);
    };
  }
}
