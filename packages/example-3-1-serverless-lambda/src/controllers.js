/**
 * example-3-1-serverless-lambda — controllers
 *
 * Same static __routes convention.
 *
 * Lambda difference: path parameters use {name} syntax (API Gateway style),
 * not :name. Handlers receive a normalized request object and return plain
 * objects — LambdaAdapter serialises to { statusCode, body, headers }.
 */

export class GreetingController {
  static qualifier = '@alt-javascript/example-3-1-serverless-lambda/GreetingController';

  // API Gateway route key format: METHOD /path
  // Path params use {param} syntax (not :param)
  static __routes = [
    { method: 'GET', path: '/health',         handler: 'health' },
    { method: 'GET', path: '/greet/{name}',   handler: 'greet' },
  ];

  constructor() {
    this.logger = null;
    this.config = null;
    this.greetingService = null;
    this.appName = '${app.name:Lambda Example}';
    this.version = '${app.version:1.0.0}';
  }

  init() {
    this.logger.debug('GreetingController initialised');
  }

  health() {
    return { status: 'ok', app: this.appName, version: this.version };
  }

  greet(request) {
    const { name } = request.params;
    const message = this.greetingService.greet(name);
    this.logger.debug(`GET /greet/${name} → ${message}`);
    return { message };
  }
}
