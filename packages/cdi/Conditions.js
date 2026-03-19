/**
 * Conditions — Conditional bean registration for @alt-javascript/cdi
 *
 * Condition functions return predicates evaluated during context preparation
 * to decide whether a component should be registered.
 */

/**
 * Register only if a config property has the expected value.
 *
 * @param {string} path — config property path (dot notation)
 * @param {*} [expectedValue] — expected value (if omitted, checks existence only)
 * @param {*} [matchIfMissing=false] — register if property doesn't exist
 * @returns {Function} condition predicate(config, components)
 */
export function conditionalOnProperty(path, expectedValue, matchIfMissing = false) {
  return function conditionOnProperty(config) {
    if (!config || typeof config.has !== 'function') {
      return matchIfMissing;
    }
    if (!config.has(path)) {
      return matchIfMissing;
    }
    if (typeof expectedValue === 'undefined') {
      return true;
    }
    const actual = config.get(path);
    return actual === expectedValue || String(actual) === String(expectedValue);
  };
}

/**
 * Register only if a bean with the given name is NOT already registered.
 *
 * @param {string} beanName
 * @returns {Function} condition predicate(config, components)
 */
export function conditionalOnMissingBean(beanName) {
  return function conditionOnMissingBean(config, components) {
    return !components || !components[beanName];
  };
}

/**
 * Register only if a bean with the given name IS already registered.
 *
 * @param {string} beanName
 * @returns {Function} condition predicate(config, components)
 */
export function conditionalOnBean(beanName) {
  return function conditionOnBean(config, components) {
    return components && !!components[beanName];
  };
}

/**
 * Register only if a class reference is available.
 *
 * @param {string|Function} classRef — class constructor or global name string
 * @returns {Function} condition predicate(config, components)
 */
export function conditionalOnClass(classRef) {
  return function conditionOnClass() {
    if (typeof classRef === 'function') return true;
    if (typeof classRef === 'string') {
      try {
        return typeof globalThis[classRef] !== 'undefined';
      } catch {
        return false;
      }
    }
    return false;
  };
}

/**
 * Compose conditions with AND logic.
 *
 * @param {...Function} conditions
 * @returns {Function} combined condition predicate
 */
export function allOf(...conditions) {
  return function combinedCondition(config, components) {
    return conditions.every((c) => c(config, components));
  };
}

/**
 * Compose conditions with OR logic.
 *
 * @param {...Function} conditions
 * @returns {Function} combined condition predicate
 */
export function anyOf(...conditions) {
  return function combinedCondition(config, components) {
    return conditions.some((c) => c(config, components));
  };
}

/**
 * Filter component definitions by evaluating their conditions.
 *
 * @param {Array} componentDefs — component definitions with optional `condition`
 * @param {Object} config — config with has()/get()
 * @param {Object} [components={}] — existing registered components
 * @returns {Array} filtered definitions
 */
export function evaluateConditions(componentDefs, config, components = {}) {
  return componentDefs.filter((def) => {
    if (!def.condition) return true;
    if (typeof def.condition === 'function') {
      return def.condition(config, components);
    }
    return true;
  });
}
