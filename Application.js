const { ApplicationContext } = require('@alt-javascript/cdi');
const Boot = require('./Boot');

module.exports = class Application {
  static run(optionsArg) {
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
};
