/**
 * @alt-javascript/boot-alpine — Alpine.js integration for CDI.
 *
 * Bridges CDI ApplicationContext into Alpine.js components via
 * Alpine.store() and/or global $cdi magic property.
 *
 * CDN usage (no build step):
 *   <script type="module">
 *     import { bootAlpine } from '@alt-javascript/boot-alpine';
 *     await bootAlpine({ contexts, config });
 *   </script>
 *   <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3/dist/cdn.min.js"></script>
 *
 *   <!-- In templates: -->
 *   <div x-data="{ greeting: $store.cdi.greetingService.greet('World') }">
 *     <p x-text="greeting"></p>
 *   </div>
 *
 * CDI beans are exposed on Alpine.store('cdi') as properties,
 * and the full ApplicationContext is available as Alpine.store('cdi').ctx.
 */
import { ApplicationContext } from '@alt-javascript/cdi';
import { Context } from '@alt-javascript/cdi/context/index.js';

/**
 * Boot CDI and register all singletons as an Alpine store.
 *
 * @param {object} options
 * @param {Array} options.contexts — CDI Context instances
 * @param {object} options.config — config object
 * @param {object} [options.Alpine] — Alpine instance (default: window.Alpine)
 * @param {string} [options.storeName] — store name (default: 'cdi')
 * @returns {Promise<{ applicationContext, store }>}
 */
export async function bootAlpine(options) {
  const { contexts, config } = options;
  const storeName = options.storeName || 'cdi';
  const Alpine = options.Alpine
    || (typeof window !== 'undefined' && window.Alpine);

  // Boot CDI
  const appCtx = new ApplicationContext({ contexts, config });
  await appCtx.start({ run: false });

  // Build store object from CDI singletons
  const store = { ctx: appCtx };
  const components = appCtx.components;
  for (const name of Object.keys(components)) {
    if (components[name].instance) {
      store[name] = components[name].instance;
    }
  }

  // Register with Alpine if available
  if (Alpine && typeof Alpine.store === 'function') {
    Alpine.store(storeName, store);
  }

  return { applicationContext: appCtx, store };
}
