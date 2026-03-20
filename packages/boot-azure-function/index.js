import { ApplicationContext } from '@alt-javascript/cdi';
import AzureFunctionAdapter from './AzureFunctionAdapter.js';

/**
 * Create an Azure Functions HTTP trigger handler that boots CDI on
 * the first invocation and reuses the context across subsequent calls.
 *
 * Usage:
 *   import { createAzureFunctionHandler } from '@alt-javascript/boot-azure-function';
 *
 *   const handler = createAzureFunctionHandler({ contexts: [...], config });
 *
 *   app.http('api', {
 *     methods: ['GET', 'POST', 'PUT', 'DELETE'],
 *     route: '{*path}',
 *     handler,
 *   });
 *
 * @param {object} options
 * @param {Array} options.contexts — CDI Context instances
 * @param {object} options.config — config object
 * @returns {Function} (request, invocationContext) => Promise<HttpResponseInit>
 */
export function createAzureFunctionHandler(options) {
  let adapter = null;
  let bootPromise = null;

  async function bootstrap() {
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

export { AzureFunctionAdapter };
