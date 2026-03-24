/**
 * example-3-2-serverless-azure-function — Azure Functions handler entry point
 *
 * Identical Boot.boot() idiom to the Lambda example:
 * - { run: false } — CDI wires and inits all beans; run phase skipped
 * - azureFunctionStarter() registers the AzureFunctionAdapter singleton
 * - appCtxPromise is module-level: cold start awaits, warm calls reuse
 *
 * In production, register with Azure Functions v4 app.http() or
 * expose `handler` as the default export for the function.
 *
 * Locally testable via `npm run invoke` (invoke.js) or unit tests.
 */
import { Boot } from '@alt-javascript/boot';
import { Context, Singleton } from '@alt-javascript/cdi';
import { azureFunctionStarter } from '@alt-javascript/boot-azure-function';
import { GreetingService } from './src/services.js';
import { GreetingController } from './src/controllers.js';

const context = new Context([
  ...azureFunctionStarter(),
  new Singleton(GreetingService),
  new Singleton(GreetingController),
]);

const appCtxPromise = Boot.boot({ contexts: [context], run: false });

export async function handler(request, invocationContext) {
  const appCtx = await appCtxPromise;
  return appCtx.get('azureFunctionAdapter').handle(request, invocationContext);
}
