/**
 * example-1-3-intro-cdi — services
 *
 * Demonstrates idiomatic CDI patterns:
 *
 *   static qualifier   — gives each class a stable logger category name, independent
 *                        of minification or module location. Mirrors Java's class-level
 *                        logging convention.
 *
 *   Property injection — string values starting with '${' are resolved against config
 *                        by ApplicationContext. Format: '${config.path:defaultValue}'
 *
 *   Null autowiring    — null properties are matched by name to registered CDI components
 *                        and injected automatically.
 *
 *   run()              — called by ApplicationContext during the run phase. Put your
 *                        application logic here, not in main.js.
 */

export class GreetingRepository {
  // qualifier: category string used by LoggerFactory when autowiring this.logger.
  // Without it, the category defaults to the class name — fine, but less informative
  // across module boundaries.
  static qualifier = '@alt-javascript/example-1-3-intro-cdi/GreetingRepository';

  constructor() {
    this.logger = null; // autowired: CDI injects a logger via the default loggerFactory
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
  static qualifier = '@alt-javascript/example-1-3-intro-cdi/GreetingService';

  constructor() {
    this.logger = null;             // autowired
    this.config = null;             // autowired — the default config instance
    this.greetingRepository = null; // autowired

    // Property injection — ApplicationContext resolves '${app.greeting:Hello}' from config.
    // The value after ':' is the default if the config key is absent.
    this.greeting = '${app.greeting:Hello}';
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

/**
 * Application — the run() method is the application entry point.
 * CDI calls run() during the lifecycle run phase, after all singletons
 * are wired and initialised.
 */
export class Application {
  static qualifier = '@alt-javascript/example-1-3-intro-cdi/Application';

  constructor() {
    this.logger = null;          // autowired
    this.config = null;          // autowired
    this.greetingService = null; // autowired
    this.appName = '${app.name:CDI Example}'; // property injection
  }

  run() {
    this.logger.info(`[${this.appName}] Starting`);
    console.log(this.greetingService.greet('World'));
    console.log(this.greetingService.greet('Alt-JavaScript'));
  }
}
