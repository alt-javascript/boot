/**
 * example-2-3-servers-hono — controllers
 *
 * Same static __routes convention as Express/Fastify.
 *
 * Hono difference: handlers receive a normalized request object
 * (params, query, body, honoCtx) and return a plain object.
 * HonoControllerRegistrar calls c.json(result) automatically.
 *
 * This means controller code is framework-agnostic — identical
 * to what you'd write for Express or Fastify.
 */

export class GreetingController {
  static qualifier = '@alt-javascript/example-2-3-servers-hono/GreetingController';

  static __routes = [
    { method: 'GET', path: '/',            handler: 'health' },
    { method: 'GET', path: '/greet/:name', handler: 'greet' },
  ];

  constructor() {
    this.logger = null;
    this.config = null;
    this.greetingService = null;
    this.appName = '${app.name:Hono Example}';
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
