/**
 * example-4-2-frontend-vue-vite — application entry point
 *
 * vueStarter() boots CDI then mounts the Vue SFC root component.
 *
 * URL → profile resolution is automatic: Boot.boot() reads profiles.urls
 * from the config POJO and resolves the active profile from window.location.
 * No manual BrowserProfileResolver / ProfileAwareConfig wiring needed.
 *
 *   localhost:5173   → dev   (green badge)
 *   127.0.0.1:5173   → local (blue badge)
 */
import { createApp } from 'vue';
import { vueStarter } from '@alt-javascript/boot-vue';
import { Context, Singleton } from '@alt-javascript/cdi';
import App from './src/App.vue';
import { TodoService } from './src/services.js';

const { applicationContext } = await vueStarter({
  createApp,
  rootComponent: App,
  selector: '#app',
  contexts: [new Context([new Singleton(TodoService)])],
  config: {
    boot: { 'banner-mode': 'log' },
    app: {
      name: import.meta.env.VITE_APP_NAME || 'Vue Vite Todo',
      version: '1.0.0',
      env: 'default',
    },
    logging: { level: { ROOT: 'info' } },
    profiles: {
      urls: {
        'localhost:5173':   'dev',
        '127.0.0.1:5173':  'local',
      },
      dev: {
        app: { env: 'development (localhost)' },
        logging: { level: { ROOT: 'debug' } },
      },
      local: {
        app: { env: 'local (127.0.0.1)' },
        logging: { level: { ROOT: 'debug' } },
      },
    },
  },
  // Pass resolved profile info into the Vue component tree via provide.
  // App.vue reads these with inject('activeProfile') and inject('appEnv').
  onReady(vueApp, appCtx) {
    vueApp.provide('activeProfile', (appCtx.config.activeProfiles?.[0]) || 'default');
    vueApp.provide('appEnv', appCtx.config.get('app.env', 'default'));
  },
});
