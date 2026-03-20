import { ApplicationContext } from '@alt-javascript/cdi';
import CloudflareWorkerAdapter from './CloudflareWorkerAdapter.js';

/**
 * Create a Cloudflare Workers fetch handler that boots CDI on the first
 * request and reuses the context across subsequent requests.
 *
 * Usage in wrangler worker entry:
 *   import { createWorkerHandler } from '@alt-javascript/boot-cloudflare-worker';
 *
 *   export default {
 *     fetch: createWorkerHandler({ contexts: [...], config })
 *   };
 *
 * env bindings (secrets, KV, D1) are available on request.env in handlers.
 *
 * @param {object} options
 * @param {Array} options.contexts — CDI Context instances
 * @param {object} options.config — config object
 * @returns {Function} (request, env, ctx) => Promise<Response>
 */
export function createWorkerHandler(options) {
  let adapter = null;
  let bootPromise = null;

  async function bootstrap() {
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

export { CloudflareWorkerAdapter };
