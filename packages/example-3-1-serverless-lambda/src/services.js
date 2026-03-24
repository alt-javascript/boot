/**
 * example-3-1-serverless-lambda — services
 *
 * Identical CDI patterns to all other examples.
 * Lambda doesn't change the service layer at all.
 */

export class GreetingService {
  static qualifier = '@alt-javascript/example-3-1-serverless-lambda/GreetingService';

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
