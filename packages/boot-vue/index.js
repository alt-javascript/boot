/**
 * @alt-javascript/boot-vue — Vue 3 integration for CDI.
 *
 * Bridges CDI ApplicationContext into Vue's reactive system via
 * Vue's provide/inject pattern.
 *
 * CDN usage (no build step):
 *   <script type="module">
 *     import { createCdiApp } from '@alt-javascript/boot-vue';
 *     const app = await createCdiApp({ contexts, config, rootComponent });
 *     app.mount('#app');
 *   </script>
 *
 * Vite/CLI usage:
 *   import { cdiPlugin } from '@alt-javascript/boot-vue';
 *   const app = createApp(App);
 *   app.use(cdiPlugin, { contexts, config });
 *   app.mount('#app');
 *
 * In components, access CDI beans via inject:
 *   const todoService = inject('todoService');
 *   const ctx = inject('applicationContext');
 */
import { ApplicationContext } from '@alt-javascript/cdi';
import { Context } from '@alt-javascript/cdi/context/index.js';

/**
 * Boot CDI and create a Vue app with all singletons provided.
 *
 * For CDN usage where Vue is loaded globally (window.Vue).
 * For Vite/CLI usage, pass the Vue createApp function.
 *
 * @param {object} options
 * @param {Array} options.contexts — CDI Context instances
 * @param {object} options.config — config object
 * @param {object} options.rootComponent — Vue root component definition
 * @param {Function} [options.createApp] — Vue.createApp (default: window.Vue?.createApp)
 * @param {Function} [options.onReady] — called with (app, ctx) after CDI boot, before mount
 * @returns {Promise<{ vueApp, applicationContext }>}
 */
export async function createCdiApp(options) {
  const { contexts, config, rootComponent, onReady } = options;
  const createApp = options.createApp
    || (typeof window !== 'undefined' && window.Vue?.createApp);

  if (!createApp) {
    throw new Error(
      'Vue createApp not found. Pass it as options.createApp or load Vue globally.',
    );
  }

  // Boot CDI
  const appCtx = new ApplicationContext({ contexts, config });
  await appCtx.start({ run: false });

  // Create Vue app
  const vueApp = createApp(rootComponent);

  // Provide all CDI singletons to Vue's inject system
  _provideContext(vueApp, appCtx);

  if (onReady) {
    await onReady(vueApp, appCtx);
  }

  return { vueApp, applicationContext: appCtx };
}

/**
 * Vue plugin that boots CDI and provides all singletons.
 *
 * Usage:
 *   app.use(cdiPlugin, { contexts, config });
 *
 * Then in components:
 *   const todoService = inject('todoService');
 */
export const cdiPlugin = {
  /**
   * @param {import('vue').App} app
   * @param {{ contexts: Array, config: object }} options
   */
  async install(app, options) {
    const { contexts, config } = options;

    const appCtx = new ApplicationContext({ contexts, config });
    await appCtx.start({ run: false });

    _provideContext(app, appCtx);
  },
};

/**
 * Provide all CDI singletons and the ApplicationContext itself
 * to a Vue app via app.provide().
 *
 * @param {import('vue').App} app — Vue app instance
 * @param {ApplicationContext} appCtx — booted CDI context
 */
function _provideContext(app, appCtx) {
  // Provide the ApplicationContext itself
  app.provide('applicationContext', appCtx);
  app.provide('ctx', appCtx);

  // Provide each singleton bean by name
  const components = appCtx.components;
  for (const name of Object.keys(components)) {
    const component = components[name];
    if (component.instance) {
      app.provide(name, component.instance);
    }
  }
}

/**
 * Resolve a CDI bean by name from the ApplicationContext.
 * Utility for use outside Vue's inject system (e.g. in setup scripts).
 *
 * @param {ApplicationContext} ctx
 * @param {string} name
 * @returns {*}
 */
export function getBean(ctx, name) {
  return ctx.get(name);
}
