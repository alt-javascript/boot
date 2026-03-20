/**
 * @alt-javascript/boot-lambda — AWS Lambda adapter for the alt-javascript framework.
 *
 * Provides CDI-managed serverless handler with controller auto-registration.
 * Same `__routes` convention as Express and Fastify adapters.
 *
 * Usage:
 *   import { createLambdaHandler, lambdaAutoConfiguration } from '@alt-javascript/boot-lambda';
 *   import { ApplicationContext, Context } from '@alt-javascript/cdi';
 *
 *   // Option A: createLambdaHandler (standalone, manages its own context)
 *   export const handler = createLambdaHandler({
 *     contexts: [new Context([...myComponents])],
 *     config,
 *   });
 *
 *   // Option B: lambdaAutoConfiguration (CDI-managed, for use with Application.run())
 *   const context = new Context([...lambdaAutoConfiguration(), ...myComponents]);
 */
import { ApplicationContext } from '@alt-javascript/cdi';
import LambdaAdapter from './LambdaAdapter.js';
import LambdaControllerRegistrar from './LambdaControllerRegistrar.js';

/**
 * Create a Lambda handler function that boots CDI on cold start and
 * dispatches API Gateway events to controller methods.
 *
 * The CDI context is booted once and reused across warm invocations.
 * This is the standard Lambda pattern for connection pooling, config
 * caching, and singleton reuse.
 *
 * @param {object} options
 * @param {Array} options.contexts — CDI Context instances
 * @param {object} options.config — config object (EphemeralConfig, ValueResolvingConfig, etc.)
 * @param {object} [options.startOptions] — options passed to ApplicationContext.start()
 * @returns {Function} Lambda handler: (event, lambdaContext) => Promise<Response>
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
 * @returns {Array} component definitions for CDI Context
 */
export function lambdaAutoConfiguration() {
  return [
    {
      name: 'lambdaAdapter',
      Reference: LambdaAdapterFactory,
      scope: 'singleton',
      condition: (config, components) => !components.lambdaAdapter,
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
