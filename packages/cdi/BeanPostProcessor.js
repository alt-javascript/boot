/**
 * BeanPostProcessor — hook into the ApplicationContext bean lifecycle.
 *
 * Implement postProcessBeforeInitialization and/or postProcessAfterInitialization
 * to intercept bean creation. Register as a context component like any other bean.
 *
 * ApplicationContext detects BeanPostProcessor instances automatically and calls
 * them for every singleton during the lifecycle.
 *
 * The default implementations return the instance unchanged.
 */
export default class BeanPostProcessor {
  /**
   * Called after dependency injection but before init() for each singleton.
   *
   * @param {Object} instance — the bean instance
   * @param {string} name — the bean name in the context
   * @returns {Object} the (possibly modified or replaced) bean instance
   */
  postProcessBeforeInitialization(instance, name) {
    return instance;
  }

  /**
   * Called after init() for each singleton.
   *
   * @param {Object} instance — the bean instance
   * @param {string} name — the bean name in the context
   * @returns {Object} the (possibly modified or replaced) bean instance
   */
  postProcessAfterInitialization(instance, name) {
    return instance;
  }
}
