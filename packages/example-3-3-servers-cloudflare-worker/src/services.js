/**
 * example-3-3-servers-cloudflare-worker — services
 */

export class GreetingService {
  static qualifier = '@alt-javascript/example-3-3-servers-cloudflare-worker/GreetingService';

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
