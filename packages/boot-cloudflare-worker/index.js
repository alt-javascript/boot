/**
 * @alt-javascript/boot-cloudflare-worker — Cloudflare Workers adapter.
 *
 * Provides CDI-managed fetch handler with controller auto-registration.
 * Same `__routes` convention as all other adapters.
 * Returns Web Standards Response objects.
 *
 * Usage (idiomatic — Boot.boot() pattern):
 *   import { cloudflareWorkerStarter } from '@alt-javascript/boot-cloudflare-worker';
 *   import { Boot } from '@alt-javascript/boot';
 *   import { Context, Singleton } from '@alt-javascript/cdi';
 *
 *   const context = new Context([...cloudflareWorkerStarter(), new Singleton(MyController)]);
 *   const appCtxPromise = Boot.boot({ contexts: [context], run: false });
 *
 *   export default {
 *     async fetch(request, env, ctx) {
 *       const appCtx = await appCtxPromise;
 *       return appCtx.get('cloudflareWorkerAdapter').fetch(request, env, ctx);
 *     }
 *   };
 */
import {
  RequestLoggerMiddleware,
  ErrorHandlerMiddleware,
  NotFoundMiddleware,
} from '@alt-javascript/boot';
import CloudflareWorkerAdapter from './CloudflareWorkerAdapter.js';

/**
 * Returns CDI component definitions that register a CloudflareWorkerAdapter as a singleton.
 *
 * Registers:
 * - `cloudflareWorkerAdapter` — CDI-managed Cloudflare fetch handler with route dispatch
 * - `requestLoggerMiddleware` — per-request logging (order: 10)
 * - `errorHandlerMiddleware` — exception → structured response (order: 20)
 * - `notFoundMiddleware` — null route result → 404 (order: 30)
 *
 * @returns {Array} component definitions for CDI Context
 */
export function cloudflareWorkerStarter() {
  return [
    {
      name: 'cloudflareWorkerAdapter',
      Reference: CloudflareWorkerAdapterFactory,
      scope: 'singleton',
      condition: (config, components) => !components.cloudflareWorkerAdapter,
    },
    {
      name: 'requestLoggerMiddleware',
      Reference: RequestLoggerMiddleware,
      scope: 'singleton',
      condition: (config, components) => !components.requestLoggerMiddleware,
    },
    {
      name: 'errorHandlerMiddleware',
      Reference: ErrorHandlerMiddleware,
      scope: 'singleton',
      condition: (config, components) => !components.errorHandlerMiddleware,
    },
    {
      name: 'notFoundMiddleware',
      Reference: NotFoundMiddleware,
      scope: 'singleton',
      condition: (config, components) => !components.notFoundMiddleware,
    },
  ];
}

/**
 * Factory class that CDI instantiates as a singleton.
 * Creates the CloudflareWorkerAdapter during init() after all components are wired.
 */
class CloudflareWorkerAdapterFactory {
  constructor() {
    this._adapter = null;
    this._applicationContext = null;
  }

  setApplicationContext(ctx) {
    this._applicationContext = ctx;
  }

  init() {
    this._adapter = new CloudflareWorkerAdapter(this._applicationContext);
  }

  get routeCount() {
    return this._adapter?.routeCount || 0;
  }

  async fetch(request, env, workerCtx) {
    return this._adapter.fetch(request, env, workerCtx);
  }
}

/**
 * @deprecated Use Boot.boot({ contexts: [...cloudflareWorkerStarter(), ...], run: false }) instead.
 *
 * Create a Cloudflare Workers fetch handler that boots CDI on the first
 * request and reuses the context across subsequent requests.
 */
export function createWorkerHandler(options) {
  let adapter = null;
  let bootPromise = null;

  async function bootstrap() {
    const { ApplicationContext } = await import('@alt-javascript/cdi');
    const appCtx = new ApplicationContext({
      contexts: options.contexts,
      config: options.config,
    });
    await appCtx.start({ run: false });
    adapter = new CloudflareWorkerAdapter(appCtx);
  }

  return async function fetch(request, env, ctx) {
    if (!adapter) {
      if (!bootPromise) bootPromise = bootstrap();
      await bootPromise;
    }
    return adapter.fetch(request, env, ctx);
  };
}

export { CloudflareWorkerAdapter, CloudflareWorkerAdapterFactory };
