/**
 * FastifyAdapter — CDI-managed Fastify server.
 *
 * Creates a Fastify instance during init(), registers controllers,
 * starts listening during run(), and closes the server on destroy().
 *
 * Reads from config:
 *   server.port — listen port (default: 3000)
 *   server.host — listen host (default: '0.0.0.0')
 *
 * Makes the ApplicationContext available to route handlers via
 * fastify.ctx (decorated) and request.ctx (request decorator).
 */
import Fastify from 'fastify';
import MiddlewarePipeline from '@alt-javascript/boot/MiddlewarePipeline.js';
import FastifyControllerRegistrar from './FastifyControllerRegistrar.js';

export default class FastifyAdapter {
  constructor() {
    this._fastify = null;
    this._applicationContext = null;
    this._port = 3000;
    this._host = '0.0.0.0';
  }

  /**
   * CDI aware interface — receives the ApplicationContext.
   * @param {ApplicationContext} ctx
   */
  setApplicationContext(ctx) {
    this._applicationContext = ctx;
  }

  /** @returns {object|null} logger from context, or null */
  get _logger() {
    try {
      return this._applicationContext?.get('logger', null);
    } catch {
      return null;
    }
  }

  /**
   * CDI init lifecycle — create Fastify instance, register controllers.
   */
  init() {
    const config = this._applicationContext.config;

    if (config.has('server.port')) {
      this._port = config.get('server.port');
    }
    if (config.has('server.host')) {
      this._host = config.get('server.host');
    }

    this._fastify = Fastify({ logger: false });

    // Decorate fastify instance with the CDI context
    this._fastify.decorate('ctx', this._applicationContext);

    // Decorate request with ctx for convenience in handlers
    this._fastify.decorateRequest('ctx', null);
    this._fastify.addHook('onRequest', async (request) => {
      request.ctx = this._applicationContext;
    });

    // Collect CDI middleware sorted by order
    const middlewares = MiddlewarePipeline.collect(this._applicationContext);

    // Register controllers with the middleware pipeline
    FastifyControllerRegistrar.register(this._fastify, this._applicationContext, middlewares);

    if (this._logger) {
      this._logger.verbose(`Fastify instance created, ${FastifyControllerRegistrar.routeCount} routes registered`);
    }
  }

  /**
   * CDI run lifecycle — start listening.
   */
  async run() {
    await this._fastify.listen({ port: this._port, host: this._host });
    if (this._logger) {
      this._logger.info(`Fastify listening on ${this._host}:${this._port}`);
    }
  }

  /**
   * CDI destroy lifecycle — close the Fastify server and exit cleanly.
   * Idempotent: guard on this._fastify prevents double-close.
   */
  async destroy() {
    if (!this._fastify) return;
    const fastify = this._fastify;
    this._fastify = null;

    if (this._logger) {
      this._logger.info('Fastify server closing...');
    }
    try {
      await fastify.close();
    } catch {
      // ignore close errors during shutdown
    }
    // Give the event loop 500ms to flush logs, then exit.
    setTimeout(() => process.exit(0), 500);
  }

  /** @returns {import('fastify').FastifyInstance} the Fastify instance */
  get fastify() {
    return this._fastify;
  }
}
