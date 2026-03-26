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
import { serve } from '@hono/node-server';
import MiddlewarePipeline from '@alt-javascript/boot/MiddlewarePipeline.js';
import HonoControllerRegistrar from './HonoControllerRegistrar.js';

export default class HonoAdapter {
  constructor() {
    this._app = null;
    this._server = null;
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

    // Collect CDI middleware sorted by order
    const middlewares = MiddlewarePipeline.collect(this._applicationContext);

    // Register controllers with the middleware pipeline
    HonoControllerRegistrar.register(this._app, this._applicationContext, middlewares);

    if (this._logger) {
      this._logger.verbose(`Hono app created, ${HonoControllerRegistrar.routeCount} routes registered`);
    }
  }

  /**
   * CDI run lifecycle — start Node.js HTTP server via @hono/node-server.
   * No-op when running in a non-Node environment (e.g. Cloudflare Workers).
   */
  run() {
    if (typeof serve !== 'function') return; // non-Node environment
    this._server = serve(
      { fetch: this._app.fetch, port: this._port, hostname: this._host },
      () => {
        if (this._logger) {
          this._logger.info(`Hono listening on ${this._host}:${this._port}`);
        }
      },
    );
  }

  /**
   * CDI destroy lifecycle — close the Node.js server and exit cleanly.
   * Idempotent: guard on this._server prevents double-close.
   */
  destroy() {
    if (!this._server) return;
    const server = this._server;
    this._server = null;

    if (this._logger) {
      this._logger.info('Hono server closing...');
    }
    server.close();
    setTimeout(() => process.exit(0), 500);
  }

  /** @returns {Hono} the Hono app instance */
  get app() {
    return this._app;
  }

  /** @returns {import('node:http').Server|null} the Node.js server (after run()) */
  get server() {
    return this._server;
  }
}
