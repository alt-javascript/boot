const Boot = require('./Boot');

module.exports = class Application {
  static async run(optionsArg) {
    const options = optionsArg;
    if (!Boot.root('config')) {
      Boot.boot(options);
    }

    // eslint-disable-next-line global-require
    const ApplicationContext = require('@alt-javascript/cdi/ApplicationContext');

    options.config = options?.config || Boot.root('config');
    let applicationContext = options?.applicationContext || options;
    if (applicationContext.constructor.name !== 'ApplicationContext') {
      applicationContext = new ApplicationContext(options);
    }
    applicationContext.lifeCycle();
    return applicationContext;
  }
};
