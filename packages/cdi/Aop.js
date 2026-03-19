/**
 * AOP — Proxy-based method interception for @alt-javascript/cdi
 *
 * Uses JavaScript Proxy to intercept method calls with before, after,
 * afterReturning, afterThrowing, and around advice types.
 */

/**
 * Match a method name against a pattern.
 *
 * @param {string} methodName
 * @param {string|RegExp|Function} pattern — exact name, wildcard ('get*'), regex, or predicate
 * @returns {boolean}
 */
export function matchMethod(methodName, pattern) {
  if (typeof pattern === 'string') {
    if (pattern.includes('*')) {
      const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
      return regex.test(methodName);
    }
    return methodName === pattern;
  }
  if (pattern instanceof RegExp) {
    return pattern.test(methodName);
  }
  if (typeof pattern === 'function') {
    return pattern(methodName);
  }
  return false;
}

/**
 * Create an AOP proxy around a target object.
 *
 * @param {Object} target — the object to proxy
 * @param {Array<Object>} aspects — array of aspect definitions, each with:
 *   - pointcut: string|RegExp|Function — which methods to intercept
 *   - before: Function(args, methodName, target) — called before method
 *   - after: Function(result, args, methodName, target) — called after (always)
 *   - afterReturning: Function(result, args, methodName, target) — after success
 *   - afterThrowing: Function(error, args, methodName, target) — after exception
 *   - around: Function(proceed, args, methodName, target) — wraps entire call
 * @returns {Proxy} proxied object
 */
export function createProxy(target, aspects) {
  if (!target || typeof target !== 'object') {
    throw new Error('createProxy: target must be an object');
  }
  if (!Array.isArray(aspects) || aspects.length === 0) {
    return target;
  }

  return new Proxy(target, {
    get(obj, prop, receiver) {
      const value = Reflect.get(obj, prop, receiver);

      if (typeof value !== 'function') {
        return value;
      }

      const matchingAspects = aspects.filter((a) => matchMethod(prop, a.pointcut));
      if (matchingAspects.length === 0) {
        return value;
      }

      return function intercepted(...args) {
        const methodName = prop;

        // Before advice
        for (const aspect of matchingAspects) {
          if (aspect.before) {
            aspect.before(args, methodName, obj);
          }
        }

        // Build proceed chain for around advice
        let proceed = () => value.apply(obj, args);
        const aroundAspects = matchingAspects.filter((a) => a.around);
        for (let i = aroundAspects.length - 1; i >= 0; i--) {
          const currentProceed = proceed;
          const aspect = aroundAspects[i];
          proceed = () => aspect.around(currentProceed, args, methodName, obj);
        }

        let result;
        let error;
        try {
          result = proceed();

          for (const aspect of matchingAspects) {
            if (aspect.afterReturning) {
              aspect.afterReturning(result, args, methodName, obj);
            }
          }
        } catch (e) {
          error = e;
          for (const aspect of matchingAspects) {
            if (aspect.afterThrowing) {
              aspect.afterThrowing(e, args, methodName, obj);
            }
          }
        } finally {
          for (const aspect of matchingAspects) {
            if (aspect.after) {
              aspect.after(error || result, args, methodName, obj);
            }
          }
        }

        if (error) {
          throw error;
        }
        return result;
      };
    },
  });
}
