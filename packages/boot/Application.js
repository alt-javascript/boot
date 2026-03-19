/* eslint-disable import/extensions */
import Boot from './Boot.js';

/**
 * Convenience wrapper that boots the application and starts the ApplicationContext.
 * Combines Boot.boot() with ApplicationContext.lifeCycle() in a single call.
 *
 * @example
 * const ctx = await Application.run({ config, contexts: [myContext] });
 * const svc = ctx.get('myService');
 */
export default class Application {
  /**
   * Boot the application, create an ApplicationContext, and run its lifecycle.
   * @param {object} optionsArg - boot + context options (config, contexts, profiles, etc.)
   * @returns {Promise<ApplicationContext>} the running application context
   */
  static async run(optionsArg) {
    const options = optionsArg;
    if (!Boot.root('config')) {
      Boot.boot(options);
    }

    // eslint-disable-next-line global-require
    const ApplicationContext = await import('@alt-javascript/cdi/ApplicationContext');

    options.config = options?.config || Boot.root('config');
    let applicationContext = options?.applicationContext || options;
    if (applicationContext.constructor.name !== 'ApplicationContext') {
      applicationContext = new ApplicationContext(options);
    }
    applicationContext.lifeCycle();
    return applicationContext;
  }
}
