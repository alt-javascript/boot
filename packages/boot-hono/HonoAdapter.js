/**
 * HonoAdapter — CDI-managed Hono server.
 *
 * Creates a Hono application during init(), registers controllers via
 * Hono's native routing, and provides the Hono app for Node.js serving
 * or direct request injection in tests.
 *
 * Hono uses the Web Standards Request/Response API and runs on
 * Node.js, Cloudflare Workers, Deno, Bun, and more.
 *
 * Reads from config:
 *   server.port — listen port (default: 3000)
 *   server.host — listen host (default: '0.0.0.0')
 */
import { Hono } from 'hono';
import HonoControllerRegistrar from './HonoControllerRegistrar.js';

export default class HonoAdapter {
  constructor() {
    this._app = null;
    this._applicationContext = null;
    this._port = 3000;
    this._host = '0.0.0.0';
  }

  setApplicationContext(ctx) {
    this._applicationContext = ctx;
  }

  get _logger() {
    try {
      return this._applicationContext?.get('logger', null);
    } catch {
      return null;
    }
  }

  init() {
    const config = this._applicationContext.config;

    if (config.has('server.port')) {
      this._port = config.get('server.port');
    }
    if (config.has('server.host')) {
      this._host = config.get('server.host');
    }

    this._app = new Hono();

    // Store CDI context for access in middleware
    const appCtx = this._applicationContext;

    // Register controllers — uses Hono's native routing
    HonoControllerRegistrar.register(this._app, appCtx);

    if (this._logger) {
      this._logger.verbose(`Hono app created, ${HonoControllerRegistrar.routeCount} routes registered`);
    }
  }

  /** @returns {Hono} the Hono app instance */
  get app() {
    return this._app;
  }
}
