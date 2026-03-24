/**
 * example-3-2-serverless-azure-function — services
 *
 * Identical CDI patterns to all other examples.
 */

export class GreetingService {
  static qualifier = '@alt-javascript/example-3-2-serverless-azure-function/GreetingService';

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
}
