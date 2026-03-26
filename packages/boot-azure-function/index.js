/**
 * @alt-javascript/boot-azure-function — Azure Functions adapter for the alt-javascript framework.
 *
 * Provides CDI-managed Azure Functions HTTP trigger handler with controller auto-registration.
 * Same `__routes` convention as all other adapters.
 *
 * Usage (idiomatic — Boot.boot() pattern):
 *   import { azureFunctionStarter } from '@alt-javascript/boot-azure-function';
 *   import { Boot } from '@alt-javascript/boot';
 *   import { Context, Singleton } from '@alt-javascript/cdi';
 *
 *   const context = new Context([...azureFunctionStarter(), new Singleton(MyController)]);
 *   const appCtx = await Boot.boot({ contexts: [context], run: false });
 *   export async function handler(request, ctx) {
 *     return (await appCtx).get('azureFunctionAdapter').handle(request, ctx);
 *   }
 */
import {
  RequestLoggerMiddleware,
  ErrorHandlerMiddleware,
  NotFoundMiddleware,
} from '@alt-javascript/boot';
import AzureFunctionAdapter from './AzureFunctionAdapter.js';

/**
 * Returns CDI component definitions that register an AzureFunctionAdapter as a singleton.
 *
 * Registers:
 * - `azureFunctionAdapter` — CDI-managed Azure Functions handler with route dispatch
 * - `requestLoggerMiddleware` — per-request logging (order: 10)
 * - `errorHandlerMiddleware` — exception → structured response (order: 20)
 * - `notFoundMiddleware` — null route result → 404 (order: 30)
 *
 * @returns {Array} component definitions for CDI Context
 */
export function azureFunctionStarter() {
  return [
    {
      name: 'azureFunctionAdapter',
      Reference: AzureFunctionAdapterFactory,
      scope: 'singleton',
      condition: (config, components) => !components.azureFunctionAdapter,
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
 * Creates the AzureFunctionAdapter during init() after all components are wired.
 */
class AzureFunctionAdapterFactory {
  constructor() {
    this._adapter = null;
    this._applicationContext = null;
  }

  setApplicationContext(ctx) {
    this._applicationContext = ctx;
  }

  init() {
    this._adapter = new AzureFunctionAdapter(this._applicationContext);
  }

  get routeCount() {
    return this._adapter?.routeCount || 0;
  }

  async handle(request, invocationContext) {
    return this._adapter.handle(request, invocationContext);
  }
}

/**
 * @deprecated Use Boot.boot({ contexts: [...azureFunctionStarter(), ...], run: false }) instead.
 *
 * Create an Azure Functions HTTP trigger handler that boots CDI on
 * the first invocation and reuses the context across subsequent calls.
 */
export function createAzureFunctionHandler(options) {
  let adapter = null;
  let bootPromise = null;

  async function bootstrap() {
    const { ApplicationContext } = await import('@alt-javascript/cdi');
    const appCtx = new ApplicationContext({
      contexts: options.contexts,
      config: options.config,
    });
    await appCtx.start({ run: false });
    adapter = new AzureFunctionAdapter(appCtx);
  }

  return async function handler(request, invocationContext) {
    if (!adapter) {
      if (!bootPromise) bootPromise = bootstrap();
      await bootPromise;
    }
    return adapter.handle(request, invocationContext);
  };
}

export { AzureFunctionAdapter, AzureFunctionAdapterFactory };
