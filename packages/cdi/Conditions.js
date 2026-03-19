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
  return function combinedCondition(config, components, activeProfiles) {
    return conditions.every((c) => c(config, components, activeProfiles));
  };
}

/**
 * Compose conditions with OR logic.
 *
 * @param {...Function} conditions
 * @returns {Function} combined condition predicate
 */
export function anyOf(...conditions) {
  return function combinedCondition(config, components, activeProfiles) {
    return conditions.some((c) => c(config, components, activeProfiles));
  };
}

/**
 * Register only if one or more profiles are active.
 * Supports negation: '!test' means "register if 'test' is NOT active".
 *
 * Analogous to Spring's @Profile annotation.
 *
 * @param {...string} profileNames — profile names (prefix with ! for negation)
 * @returns {Function} condition predicate(config, components, activeProfiles)
 *
 * @example
 * // Active when 'production' profile is active
 * { condition: conditionalOnProfile('production') }
 *
 * // Active when 'test' profile is NOT active
 * { condition: conditionalOnProfile('!test') }
 *
 * // Active when 'dev' OR 'staging' profile is active
 * { condition: conditionalOnProfile('dev', 'staging') }
 */
export function conditionalOnProfile(...profileNames) {
  return function conditionOnProfile(config, components, activeProfiles) {
    const active = activeProfiles || [];
    const positive = profileNames.filter((p) => !p.startsWith('!'));
    const negated = profileNames.filter((p) => p.startsWith('!')).map((p) => p.substring(1));

    // All negations must hold (none of the negated profiles are active)
    const negationsPass = negated.length === 0
      || negated.every((n) => !active.includes(n));

    // At least one positive profile must be active (if any specified)
    const positivesPass = positive.length === 0
      || positive.some((p) => active.includes(p));

    return negationsPass && positivesPass;
  };
}

/**
 * Filter component definitions by evaluating their conditions.
 *
 * @param {Array} componentDefs — component definitions with optional `condition`
 * @param {Object} config — config with has()/get()
 * @param {Object} [components={}] — existing registered components
 * @param {string[]} [activeProfiles=[]] — active profile names
 * @returns {Array} filtered definitions
 */
export function evaluateConditions(componentDefs, config, components = {}, activeProfiles = []) {
  return componentDefs.filter((def) => {
    if (!def.condition) return true;
    if (typeof def.condition === 'function') {
      return def.condition(config, components, activeProfiles);
    }
    return true;
  });
}
