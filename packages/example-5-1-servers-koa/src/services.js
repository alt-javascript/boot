/**
 * example-5-1-servers-koa — services
 *
 * Same CDI patterns as all previous examples.
 * Koa is the async/await successor to Express — service layer unchanged.
 */

export class GreetingService {
  static qualifier = '@alt-javascript/example-5-1-servers-koa/GreetingService';

  constructor() {
    this.logger = null;
    this.config = null;
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

export class Application {
  static qualifier = '@alt-javascript/example-5-1-servers-koa/Application';

  constructor() {
    this.logger = null;
    this.config = null;
    this.appName = '${app.name:Koa Example}';
  }

  run() {
    const port = this.config.get('server.port', 3000);
    this.logger.info(`[${this.appName}] running — http://localhost:${port}`);
    this.logger.info('Press Ctrl+C to stop');
  }
}
