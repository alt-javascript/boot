/**
 * ExpressAdapter — CDI-managed Express server.
 *
 * Creates an Express application during init(), registers controllers,
 * starts listening during run(), and closes the server on destroy().
 *
 * Reads from config:
 *   server.port — listen port (default: 3000)
 *   server.host — listen host (default: '0.0.0.0')
 *
 * Makes the ApplicationContext available to route handlers via app.locals.ctx.
 */
import express from 'express';
import ControllerRegistrar from './ControllerRegistrar.js';

export default class ExpressAdapter {
  constructor() {
    this._app = null;
    this._server = null;
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
   * CDI init lifecycle — create Express app, register controllers.
   */
  init() {
    const config = this._applicationContext.config;

    if (config.has('server.port')) {
      this._port = config.get('server.port');
    }
    if (config.has('server.host')) {
      this._host = config.get('server.host');
    }

    this._app = express();
    this._app.use(express.json());
    this._app.locals.ctx = this._applicationContext;

    // Register controllers
    ControllerRegistrar.register(this._app, this._applicationContext);

    if (this._logger) {
      this._logger.verbose(`Express app created, ${ControllerRegistrar.routeCount} routes registered`);
    }
  }

  /**
   * CDI run lifecycle — start listening.
   */
  async run() {
    return new Promise((resolve) => {
      this._server = this._app.listen(this._port, this._host, () => {
        if (this._logger) {
          this._logger.info(`Express listening on ${this._host}:${this._port}`);
        }
        resolve();
      });
    });
  }

  /**
   * CDI destroy lifecycle — close the HTTP server.
   */
  destroy() {
    if (this._server) {
      this._server.close();
      if (this._logger) {
        this._logger.info('Express server closed');
      }
    }
  }

  /** @returns {express.Application} the Express app instance */
  get app() {
    return this._app;
  }

  /** @returns {http.Server} the HTTP server (after run()) */
  get server() {
    return this._server;
  }
}
