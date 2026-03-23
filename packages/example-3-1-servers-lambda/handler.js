/**
 * example-3-1-servers-lambda — Lambda handler entry point
 *
 * Uses the same Boot.boot() idiom as all other server examples.
 * The only Lambda-specific difference is { run: false } — this tells Boot
 * to wire and init all CDI beans but skip the run phase (no servers to start).
 *
 * The exported `handler` function is what AWS Lambda invokes per event.
 * LambdaAdapter (registered by lambdaStarter()) handles route dispatch.
 *
 * API Gateway HTTP API v2 route keys:
 *   GET /health       → GreetingController.health()
 *   GET /greet/{name} → GreetingController.greet()
 *
 * Locally testable via `npm run invoke` (invoke.js) or unit tests.
 */
import { Boot } from '@alt-javascript/boot';
import { Context, Singleton } from '@alt-javascript/cdi';
import { lambdaStarter } from '@alt-javascript/boot-lambda';
import { GreetingService } from './src/services.js';
import { GreetingController } from './src/controllers.js';

const context = new Context([
  ...lambdaStarter(),
  new Singleton(GreetingService),
  new Singleton(GreetingController),
]);

// Boot once — CDI wires and inits all beans; run phase skipped (no HTTP server).
// appCtx is a module-level promise: cold start awaits it, warm invocations reuse it.
const appCtxPromise = Boot.boot({ contexts: [context], run: false });

export async function handler(event, lambdaContext) {
  const appCtx = await appCtxPromise;
  return appCtx.get('lambdaAdapter').handle(event, lambdaContext);
}
