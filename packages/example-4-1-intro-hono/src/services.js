/**
 * example-4-1-intro-hono — services
 *
 * Same CDI patterns as the Express and Fastify examples.
 * Hono's Web Standards API doesn't affect the service layer at all.
 */

export class GreetingService {
  static qualifier = '@alt-javascript/example-4-1-intro-hono/GreetingService';

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
  static qualifier = '@alt-javascript/example-4-1-intro-hono/Application';

  constructor() {
    this.logger = null;
    this.config = null;
    this.appName = '${app.name:Hono Example}';
  }

  run() {
    const port = this.config.get('server.port', 3000);
    this.logger.info(`[${this.appName}] running — http://localhost:${port}`);
    this.logger.info('Press Ctrl+C to stop');
  }
}
