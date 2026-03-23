/**
 * example-2-1-intro-express — services
 *
 * Same CDI patterns as example-1-3:
 *   - static qualifier, null autowiring, property injection
 *
 * Application.run() logs the server URL after Boot.boot() starts the ExpressAdapter.
 */

export class GreetingService {
  static qualifier = '@alt-javascript/example-2-1-intro-express/GreetingService';

  constructor() {
    this.logger = null;          // autowired
    this.config = null;          // autowired
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
  static qualifier = '@alt-javascript/example-2-1-intro-express/Application';

  constructor() {
    this.logger = null;   // autowired
    this.config = null;   // autowired
    this.appName = '${app.name:Express Example}';
  }

  run() {
    const port = this.config.get('server.port', 3000);
    this.logger.info(`[${this.appName}] running — http://localhost:${port}`);
    this.logger.info('Press Ctrl+C to stop');
  }
}
