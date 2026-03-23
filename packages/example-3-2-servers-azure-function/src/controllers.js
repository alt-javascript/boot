/**
 * example-3-2-servers-azure-function — controllers
 *
 * Same static __routes convention.
 *
 * Azure difference: path params use :name syntax (URL-based routing).
 * Handlers return plain objects — AzureFunctionAdapter wraps in { status, jsonBody }.
 * Response is { status, jsonBody } (not { statusCode, body } like Lambda).
 */

export class GreetingController {
  static qualifier = '@alt-javascript/example-3-2-servers-azure-function/GreetingController';

  static __routes = [
    { method: 'GET', path: '/health',       handler: 'health' },
    { method: 'GET', path: '/greet/:name',  handler: 'greet' },
  ];

  constructor() {
    this.logger = null;
    this.config = null;
    this.greetingService = null;
    this.appName = '${app.name:Azure Function Example}';
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
