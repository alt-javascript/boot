/**
 * example-3-1-servers-fastify — controllers
 *
 * Declarative __routes pattern — same as Express example.
 * Fastify handlers receive (request, reply) instead of (req, res).
 * reply.send() is used instead of res.json().
 */

export class GreetingController {
  static qualifier = '@alt-javascript/example-3-1-servers-fastify/GreetingController';

  static __routes = [
    { method: 'GET', path: '/',            handler: 'health' },
    { method: 'GET', path: '/greet/:name', handler: 'greet' },
  ];

  constructor() {
    this.logger = null;
    this.config = null;
    this.greetingService = null;
    this.appName = '${app.name:Fastify Example}';
    this.version = '${app.version:1.0.0}';
  }

  init() {
    this.logger.debug('GreetingController initialised');
  }

  health(request, reply) {
    reply.send({
      status: 'ok',
      app: this.appName,
      version: this.version,
    });
  }

  greet(request, reply) {
    const { name } = request.params;
    const message = this.greetingService.greet(name);
    this.logger.debug(`GET /greet/${name} → ${message}`);
    reply.send({ message });
  }
}
