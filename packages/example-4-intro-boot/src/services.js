/**
 * example-4-intro-boot — services
 *
 * Same patterns as example-3-intro-cdi:
 *   - static qualifier for logger category
 *   - Property injection with '${config.path:default}' placeholders
 *   - Null-property autowiring
 *   - Application.run() as the lifecycle entry point
 *
 * The difference from example-3: this module doesn't wire the logger factory
 * manually. Boot.boot() does it — and also prints the banner.
 */

export class GreetingRepository {
  static qualifier = '@alt-javascript/example-4-intro-boot/GreetingRepository';

  constructor() {
    this.logger = null; // autowired by CDI from global root loggerFactory
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
  static qualifier = '@alt-javascript/example-4-intro-boot/GreetingService';

  constructor() {
    this.logger = null;             // autowired
    this.greetingRepository = null; // autowired

    // Property injection — resolved from config by ApplicationContext.
    // '${app.greeting:Hello}' → config.get('app.greeting') or 'Hello' if absent.
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
 * Application is a CDI singleton with a run() method.
 * ApplicationContext calls run() during the lifecycle run phase,
 * after all dependencies are wired and init() methods have been called.
 * This is where your application logic lives — not in main.js.
 */
export class Application {
  static qualifier = '@alt-javascript/example-4-intro-boot/Application';

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
