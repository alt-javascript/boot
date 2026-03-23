/**
 * example-5-1-intro-koa — controllers
 *
 * Same static __routes convention as all other adapters.
 * Koa handlers receive a normalized request object and return plain
 * objects — identical pattern to Hono. KoaControllerRegistrar sets
 * koaCtx.body automatically.
 */

export class GreetingController {
  static qualifier = '@alt-javascript/example-5-1-intro-koa/GreetingController';

  static __routes = [
    { method: 'GET', path: '/',            handler: 'health' },
    { method: 'GET', path: '/greet/:name', handler: 'greet' },
  ];

  constructor() {
    this.logger = null;
    this.config = null;
    this.greetingService = null;
    this.appName = '${app.name:Koa Example}';
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
