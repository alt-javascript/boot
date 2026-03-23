/**
 * example-3-3-servers-cloudflare-worker — controllers
 *
 * Cloudflare difference: fetch() returns Web Standards Response objects.
 * Path params use :name syntax (same as Azure/Koa).
 *
 * env bindings (KV, D1, secrets) available on request.env in production.
 */

export class GreetingController {
  static qualifier = '@alt-javascript/example-3-3-servers-cloudflare-worker/GreetingController';

  static __routes = [
    { method: 'GET', path: '/health',      handler: 'health' },
    { method: 'GET', path: '/greet/:name', handler: 'greet' },
  ];

  constructor() {
    this.logger = null;
    this.config = null;
    this.greetingService = null;
    this.appName = '${app.name:Cloudflare Worker Example}';
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
