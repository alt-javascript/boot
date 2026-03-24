import { Boot } from 'https://cdn.jsdelivr.net/npm/@alt-javascript/boot@3/dist/alt-javascript-boot-esm.js';
import { ApplicationContext } from 'https://cdn.jsdelivr.net/npm/@alt-javascript/cdi@3/dist/alt-javascript-cdi-esm.js';

/**
 * @alt-javascript/boot-alpine — Alpine.js integration for @alt-javascript/boot.
 *
 * Two entry points:
 *
 * ## alpineStarter() — recommended (uses Boot.boot())
 *   Full lifecycle: banner, logger setup, profile URL resolution, CDI wiring.
 *   Config may be a plain POJO — Boot.boot() applies profile overlays and
 *   URL→profile mapping automatically (same as vueStarter / reactStarter).
 *
 *   CDN usage (no build step):
 *
 *   <script type="module">
 *     import { alpineStarter } from '@alt-javascript/boot-alpine';
 *     import { Context, Singleton } from '@alt-javascript/cdi';
 *     import { TodoService } from './src/services.js';
 *
 *     // Call BEFORE Alpine loads — Alpine.start() is deferred via `defer` attr.
 *     await alpineStarter({
 *       contexts: [new Context([new Singleton(TodoService)])],
 *       config: {
 *         app: { name: 'My App' },
 *         profiles: { urls: { localhost: 'dev', '127.0.0.1': 'local' } },
 *       },
 *       setup(Alpine, appCtx) {
 *         Alpine.data('todos', () => ({
 *           items: appCtx.get('todoService').getAll(),
 *           // ...
 *         }));
 *       },
 *     });
 *   </script>
 *   <!-- Alpine loads after module script has already booted CDI -->
 *   <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3/dist/cdn.min.js"></script>
 *
 * ## bootAlpine() — lower-level (no Boot.boot(), headless-friendly)
 *   Boots CDI directly and registers singletons on Alpine.store('cdi').
 *   Useful for testing or environments without window.location.
 *
 * ## Timing note (CDN pattern)
 *   Alpine CDN uses `defer`, which runs after DOMContentLoaded. A `type="module"`
 *   script is also deferred — but if it contains a top-level `await`, Alpine's
 *   defer script can run while the module's await is pending (both are microtask/
 *   task-level deferred). To guarantee the 'alpine:init' listener is registered
 *   before Alpine fires it, alpineStarter() registers the listener SYNCHRONOUSLY
 *   at call time (before any await), then boots CDI, then resolves the store into
 *   the listener via a Promise.
 */

/**
 * Boot CDI via Boot.boot() and wire all singletons into Alpine.
 *
 * Config may be a plain POJO — Boot.boot() wraps it in ValueResolvingConfig,
 * applies profile overlays, and (if profiles.urls is present) resolves the
 * active profile from window.location automatically.
 *
 * TIMING: The 'alpine:init' listener is registered SYNCHRONOUSLY before any
 * await, so it is always in place before Alpine fires the event — even if
 * CDI boot takes longer than the Alpine CDN defer'd script loading.
 *
 * @param {object}   options
 * @param {Array}    options.contexts        — CDI Context instances (required)
 * @param {object}   [options.config]        — config POJO or config object
 * @param {object}   [options.Alpine]        — Alpine instance (pass in tests)
 * @param {string}   [options.storeName]     — Alpine store name (default: 'cdi')
 * @param {Function} [options.setup]         — (Alpine, appCtx) => void — called after
 *                                            CDI boots, during alpine:init. Use to
 *                                            declare Alpine.data() and Alpine.store()
 *                                            entries that depend on CDI beans.
 * @returns {Promise<{ applicationContext, store }>}
 */
async function alpineStarter(options) {
  const { contexts, setup: setupFn } = options;
  const storeName = options.storeName || 'cdi';

  if (!contexts) throw new Error('alpineStarter: options.contexts is required.');

  // Strategy: register a PLACEHOLDER reactive store synchronously during
  // 'alpine:init', then mutate its properties in-place after Boot.boot() 
  // completes. Alpine's reactivity system re-renders automatically.
  //
  // This avoids all timing issues between async boot and Alpine.start():
  //   - The store is always registered before Alpine processes the DOM
  //   - Store properties are reactive from the start (even when null/false)
  //   - Mutations after Alpine.start() trigger re-evaluation correctly
  //
  // The placeholder has: ready:false, and one null slot per CDI singleton.
  // Callers should gate content with x-show="$store.cdi.ready".

  // Detect if Alpine is already loaded (e.g. in tests with mock Alpine)
  const Alpine = options.Alpine
    || (typeof window !== 'undefined' && window.Alpine);

  // Synchronous placeholder registration (before any await).
  // In CDN mode: listener fires during alpine:init before Alpine.start().
  // In test mode: Alpine is passed explicitly.
  function registerPlaceholder(AlpineInstance) {
    if (!AlpineInstance || typeof AlpineInstance.store !== 'function') return;
    // Don't overwrite if already registered
    if (!AlpineInstance.store(storeName)) {
      AlpineInstance.store(storeName, {
        ready:         false,
        activeProfile: '',
        appEnv:        '',
        items:         [],
        ctx:           null,
      });
    }
  }

  if (Alpine) {
    registerPlaceholder(Alpine);
  } else if (typeof document !== 'undefined') {
    document.addEventListener('alpine:init', () => {
      registerPlaceholder(window.Alpine);
    });
  }

  // Boot CDI asynchronously.
  const appCtx = await Boot.boot({ config: options.config, contexts, run: false });

  // Build full store object from CDI singletons.
  const store = _buildStore(appCtx);
  store.activeProfile = appCtx.config?.activeProfiles?.[0] || 'default';
  store.appEnv        = appCtx.config?.get?.('app.env', 'default') || 'default';
  store.items         = [];  // caller populates via setup() or x-init
  store.ready         = true;

  const resolvedAlpine = Alpine || (typeof window !== 'undefined' && window.Alpine);

  if (resolvedAlpine && typeof resolvedAlpine.store === 'function') {
    const existing = resolvedAlpine.store(storeName);
    if (existing) {
      // Mutate the existing reactive placeholder in-place.
      // Alpine tracks property access, so mutations trigger re-renders.
      Object.assign(existing, store);
    } else {
      resolvedAlpine.store(storeName, store);
    }

    if (setupFn) {
      setupFn(resolvedAlpine, appCtx);
    }
  }

  return { applicationContext: appCtx, store };
}

/**
 * Boot CDI and register all singletons as an Alpine store.
 *
 * Lower-level than alpineStarter() — does not call Boot.boot(), so profile
 * URL resolution, banner, and logger setup are not applied automatically.
 * Useful for headless (Node.js) testing or when Boot is managed externally.
 *
 * @param {object}   options
 * @param {Array}    options.contexts   — CDI Context instances
 * @param {object}   options.config     — config object
 * @param {object}   [options.Alpine]   — Alpine instance (default: window.Alpine)
 * @param {string}   [options.storeName] — store name (default: 'cdi')
 * @returns {Promise<{ applicationContext, store }>}
 */
async function bootAlpine(options) {
  const { contexts, config } = options;
  const storeName = options.storeName || 'cdi';
  const Alpine = options.Alpine
    || (typeof window !== 'undefined' && window.Alpine);

  // Boot CDI
  const appCtx = new ApplicationContext({ contexts, config });
  await appCtx.start({ run: false });

  // Build store object from CDI singletons
  const store = _buildStore(appCtx);

  // Register with Alpine if available
  if (Alpine && typeof Alpine.store === 'function') {
    Alpine.store(storeName, store);
  }

  return { applicationContext: appCtx, store };
}

/**
 * Build an Alpine store object from all CDI singleton instances.
 * The full applicationContext is also available as store.ctx.
 *
 * @internal
 */
function _buildStore(appCtx) {
  const store = { ctx: appCtx };
  const components = appCtx.components;
  for (const name of Object.keys(components)) {
    if (components[name].instance) {
      store[name] = components[name].instance;
    }
  }
  return store;
}

export { alpineStarter, bootAlpine };
