/**
 * @alt-javascript/boot-lambda — AWS Lambda adapter for the alt-javascript framework.
 *
 * Provides CDI-managed serverless handler with controller auto-registration.
 * Same `__routes` convention as Express and Fastify adapters.
 *
 * Usage (idiomatic — Boot.boot() pattern):
 *   import { lambdaStarter } from '@alt-javascript/boot-lambda';
 *   import { Boot } from '@alt-javascript/boot';
 *   import { Context, Singleton } from '@alt-javascript/cdi';
 *
 *   const context = new Context([...lambdaStarter(), new Singleton(MyController)]);
 *   const appCtx = await Boot.boot({ contexts: [context], run: false });
 *   export const handler = (event, ctx) => appCtx.get('lambdaAdapter').handle(event, ctx);
 */
import { ApplicationContext } from '@alt-javascript/cdi';
import {
  RequestLoggerMiddleware,
  ErrorHandlerMiddleware,
  NotFoundMiddleware,
} from '@alt-javascript/boot';
import LambdaAdapter from './LambdaAdapter.js';
import LambdaControllerRegistrar from './LambdaControllerRegistrar.js';

/**
 * @deprecated Use Boot.boot({ contexts: [...lambdaStarter(), ...], run: false }) instead.
 *
 * Create a Lambda handler function that boots CDI on cold start and
 * dispatches API Gateway events to controller methods.
 */
export function createLambdaHandler(options) {
  let adapter = null;
  let bootPromise = null;

  async function bootstrap() {
    const appCtx = new ApplicationContext({
      contexts: options.contexts,
      config: options.config,
    });
    await appCtx.start({ run: false, ...options.startOptions });
    adapter = new LambdaAdapter(appCtx);
  }

  return async function handler(event, lambdaContext) {
    // Boot once on cold start, reuse on warm invocations
    if (!adapter) {
      if (!bootPromise) {
        bootPromise = bootstrap();
      }
      await bootPromise;
    }

    return adapter.handle(event, lambdaContext);
  };
}

/**
 * Returns CDI component definitions that register a LambdaAdapter as a singleton.
 *
 * The adapter is created during init() after CDI wiring is complete.
 * Access the handler via: `ctx.get('lambdaAdapter').handle(event, lambdaContext)`
 *
 * Registers:
 * - `lambdaAdapter` — CDI-managed Lambda handler with route dispatch
 * - `requestLoggerMiddleware` — per-request logging (order: 10)
 * - `errorHandlerMiddleware` — exception → structured response (order: 20)
 * - `notFoundMiddleware` — null route result → 404 (order: 30)
 *
 * @returns {Array} component definitions for CDI Context
 */
export function lambdaStarter() {
  return [
    {
      name: 'lambdaAdapter',
      Reference: LambdaAdapterFactory,
      scope: 'singleton',
      condition: (config, components) => !components.lambdaAdapter,
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
 * Creates the LambdaAdapter during init() after all components are wired.
 * Delegates handle() to the inner adapter.
 */
class LambdaAdapterFactory {
  constructor() {
    this._adapter = null;
    this._applicationContext = null;
  }

  setApplicationContext(ctx) {
    this._applicationContext = ctx;
  }

  init() {
    this._adapter = new LambdaAdapter(this._applicationContext);
  }

  /** @returns {number} registered route count */
  get routeCount() {
    return this._adapter?.routeCount || 0;
  }

  /**
   * Handle an API Gateway HTTP API v2 event.
   * @param {object} event
   * @param {object} [lambdaContext]
   * @returns {Promise<{statusCode, body, headers}>}
   */
  async handle(event, lambdaContext) {
    return this._adapter.handle(event, lambdaContext);
  }
}

export { LambdaAdapter, LambdaControllerRegistrar, LambdaAdapterFactory };

/** @deprecated Use lambdaStarter() */
export const lambdaAutoConfiguration = lambdaStarter;
