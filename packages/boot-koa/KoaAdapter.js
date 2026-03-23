/**
 * KoaAdapter — CDI-managed Koa server.
 *
 * Creates a Koa application during init(), registers a body parser and
 * a routing middleware, starts listening during run(), and closes on destroy().
 *
 * Koa is the async/await successor to Express from the same team.
 * Handlers receive a Koa context object (koaCtx) with koaCtx.cdiContext
 * providing access to the ApplicationContext.
 *
 * Reads from config:
 *   server.port — listen port (default: 3000)
 *   server.host — listen host (default: '0.0.0.0')
 */
import Koa from 'koa';
import KoaControllerRegistrar from './KoaControllerRegistrar.js';

export default class KoaAdapter {
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

    this._app = new Koa();

    // JSON body parser middleware (lightweight, no dependency)
    this._app.use(async (koaCtx, next) => {
      if (koaCtx.is('application/json')) {
        const chunks = [];
        for await (const chunk of koaCtx.req) {
          chunks.push(chunk);
        }
        const raw = Buffer.concat(chunks).toString('utf-8');
        if (raw) {
          try {
            koaCtx.request.body = JSON.parse(raw);
          } catch {
            koaCtx.request.body = raw;
          }
        }
      }
      await next();
    });

    // Expose CDI ApplicationContext on every koa context
    const appCtx = this._applicationContext;
    this._app.use(async (koaCtx, next) => {
      koaCtx.cdiContext = appCtx;
      await next();
    });

    // Build route table and register routing middleware
    this._routes = new Map();
    KoaControllerRegistrar.register(this._routes, this._applicationContext);

    this._app.use(this._routingMiddleware());

    if (this._logger) {
      this._logger.verbose(`Koa app created, ${this._routes.size} routes registered`);
    }
  }

  /**
   * Returns a Koa middleware that dispatches to controller handlers
   * based on method + path matching.
   */
  _routingMiddleware() {
    const routes = this._routes;

    return async (koaCtx) => {
      const method = koaCtx.method;
      const path = koaCtx.path;

      // Try exact match, then parametric match
      const match = this._matchRoute(method, path, routes);

      if (!match) {
        koaCtx.status = 404;
        koaCtx.body = { error: `Not found: ${method} ${path}` };
        return;
      }

      const request = {
        params: match.params,
        query: koaCtx.query,
        headers: koaCtx.headers,
        body: koaCtx.request.body,
        ctx: this._applicationContext,
        koaCtx,
      };

      try {
        const result = await match.handler(request);

        if (result === null || result === undefined) {
          koaCtx.status = 204;
          koaCtx.body = '';
        } else if (result.statusCode !== undefined) {
          koaCtx.status = result.statusCode;
          koaCtx.body = result.body !== undefined ? result.body : '';
        } else {
          koaCtx.status = 200;
          koaCtx.body = result;
        }
      } catch (err) {
        koaCtx.status = err.statusCode || 500;
        koaCtx.body = { error: err.message };
      }
    };
  }

  /**
   * Match method + path against registered routes.
   * Supports parametric routes like /todos/:id.
   */
  _matchRoute(method, path, routes) {
    for (const [pattern, route] of routes) {
      const [routeMethod, routePath] = pattern.split(' ');
      if (routeMethod !== method) continue;

      const match = this._matchPath(routePath, path);
      if (match) {
        return { handler: route.handler, params: match.params };
      }
    }
    return null;
  }

  /**
   * Match a route pattern against a request path.
   * Pattern uses :param style (e.g. /todos/:id).
   * @returns {{ params: object }|null}
   */
  _matchPath(pattern, path) {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    if (patternParts.length !== pathParts.length) return null;

    const params = {};
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = pathParts[i];
      } else if (patternParts[i] !== pathParts[i]) {
        return null;
      }
    }
    return { params };
  }

  async run() {
    return new Promise((resolve) => {
      this._server = this._app.listen(this._port, this._host, () => {
        if (this._logger) {
          this._logger.info(`Koa listening on ${this._host}:${this._port}`);
        }
        resolve();
      });
    });
  }

  destroy() {
    if (!this._server) return;
    const server = this._server;
    this._server = null;

    if (this._logger) {
      this._logger.info('Koa server closing...');
    }
    server.close();
    setTimeout(() => process.exit(0), 500);
  }

  get app() {
    return this._app;
  }

  get server() {
    return this._server;
  }
}
