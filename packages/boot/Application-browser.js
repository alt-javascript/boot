/* eslint-disable import/extensions */
import Boot from './Boot-browser.js';
import { ApplicationContext } from '@alt-javascript/cdi';

export default class Application {
  static async run(optionsArg) {
    const options = optionsArg;
    if (!Boot.root('config')) {
      Boot.boot(options);
    }

    options.config = options?.config || Boot.root('config');
    let applicationContext = options?.applicationContext || options;
    if (applicationContext.constructor.name !== 'ApplicationContext') {
      applicationContext = new ApplicationContext(options);
    }
    applicationContext.lifeCycle();
    return applicationContext;
  }
}
