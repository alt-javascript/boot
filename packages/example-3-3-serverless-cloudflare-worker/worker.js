/**
 * example-3-3-serverless-cloudflare-worker — Worker entry point
 *
 * The default export { fetch } is what Cloudflare Workers runtime calls.
 * Boot.boot({ run: false }) wires CDI without starting any HTTP server.
 * cloudflareWorkerStarter() registers the CloudflareWorkerAdapter singleton.
 *
 * In production, deploy with Wrangler:
 *   npx wrangler deploy
 *
 * Locally testable via `npm run invoke` (invoke.js) or unit tests.
 * The Miniflare/Wrangler dev server is not required for unit tests.
 */
import { Boot } from '@alt-javascript/boot';
import { Context, Singleton } from '@alt-javascript/cdi';
import { cloudflareWorkerStarter } from '@alt-javascript/boot-cloudflare-worker';
import { GreetingService } from './src/services.js';
import { GreetingController } from './src/controllers.js';

const context = new Context([
  ...cloudflareWorkerStarter(),
  new Singleton(GreetingService),
  new Singleton(GreetingController),
]);

const appCtxPromise = Boot.boot({ contexts: [context], run: false });

export default {
  async fetch(request, env, ctx) {
    const appCtx = await appCtxPromise;
    return appCtx.get('cloudflareWorkerAdapter').fetch(request, env, ctx);
  },
};
