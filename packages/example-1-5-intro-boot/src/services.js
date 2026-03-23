/**
 * example-1-5-intro-boot — services
 *
 * Same patterns as example-1-3-intro-cdi:
 *   - static qualifier for logger category
 *   - Property injection with '${config.path:default}' placeholders
 *   - Null-property autowiring
 *   - Application.run() as the lifecycle entry point
 *
 * Boot.boot() injects config, loggerFactory, and loggerCategoryCache into the
 * ApplicationContext as a root context — no manual wiring of infrastructure needed.
 */

export class GreetingRepository {
  static qualifier = '@alt-javascript/example-1-5-intro-boot/GreetingRepository';

  constructor() {
    this.logger = null; // autowired via root context loggerFactory
  }

  init() {
    this.logger.debug('GreetingRepository initialised');
  }

  getRandom() {
    const greetings = ['Hello', 'Hi', 'Hey', 'Howdy'];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }
}

export class GreetingService {
  static qualifier = '@alt-javascript/example-1-5-intro-boot/GreetingService';

  constructor() {
    this.logger = null;             // autowired
    this.greetingRepository = null; // autowired
    this.greeting = '${app.greeting:Hello}'; // property injection
  }

  init() {
    this.logger.info(`GreetingService ready — greeting: "${this.greeting}"`);
  }

  greet(name) {
    return `${this.greeting}, ${name}!`;
  }

  destroy() {
    this.logger.info('GreetingService shutting down');
  }
}

export class Application {
  static qualifier = '@alt-javascript/example-1-5-intro-boot/Application';

  constructor() {
    this.logger = null;          // autowired
    this.greetingService = null; // autowired
    this.appName = '${app.name:Boot Example}'; // property injection
  }

  run() {
    this.logger.info(`[${this.appName}] Running`);
    console.log(this.greetingService.greet('World'));
    console.log(this.greetingService.greet('Alt-JavaScript'));
  }
}
