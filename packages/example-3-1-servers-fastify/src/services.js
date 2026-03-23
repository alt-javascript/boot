/**
 * example-3-1-servers-fastify — services
 *
 * Identical CDI patterns to example-2-1-servers-express.
 * The framework adapter changes; the service layer doesn't.
 */

export class GreetingService {
  static qualifier = '@alt-javascript/example-3-1-servers-fastify/GreetingService';

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
  static qualifier = '@alt-javascript/example-3-1-servers-fastify/Application';

  constructor() {
    this.logger = null;
    this.config = null;
    this.appName = '${app.name:Fastify Example}';
  }

  run() {
    const port = this.config.get('server.port', 3000);
    this.logger.info(`[${this.appName}] running — http://localhost:${port}`);
    this.logger.info('Press Ctrl+C to stop');
  }
}
