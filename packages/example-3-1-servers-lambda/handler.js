/**
 * example-3-1-servers-lambda — Lambda handler entry point
 *
 * Lambda pattern differs from the HTTP server examples:
 * - No Boot.boot() — Lambda manages its own lifecycle
 * - createLambdaHandler() boots CDI once on cold start, reuses on warm invocations
 * - Export a named `handler` function — AWS Lambda runtime calls this per event
 *
 * API Gateway HTTP API v2 route keys:
 *   GET /health       → GreetingController.health()
 *   GET /greet/{name} → GreetingController.greet()
 *
 * Locally testable via `npm run invoke` (invoke.js) or unit tests.
 */
import { createLambdaHandler } from '@alt-javascript/boot-lambda';
import { Context, Singleton } from '@alt-javascript/cdi';
import { GreetingService } from './src/services.js';
import { GreetingController } from './src/controllers.js';

const context = new Context([
  new Singleton(GreetingService),
  new Singleton(GreetingController),
]);

export const handler = createLambdaHandler({ contexts: [context] });
