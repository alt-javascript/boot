/**
 * example-4-2-frontend-vue-vite — application entry point
 *
 * vueStarter() boots CDI (config, logger, DI wiring) then mounts the Vue
 * SFC root component. All CDI singletons are available in components via
 * inject('todoService'), inject('applicationContext'), etc.
 *
 * In Vite builds the code runs in the browser, so config is declared inline
 * as a plain POJO. Boot.boot() wraps it in ValueResolvingConfig automatically.
 * Vite's import.meta.env can be used to inject build-time values.
 */
import { createApp } from 'vue';
import { vueStarter } from '@alt-javascript/boot-vue';
import { Context, Singleton } from '@alt-javascript/cdi';
import App from './src/App.vue';
import { TodoService } from './src/services.js';

// Plain POJO — Boot wraps it in ValueResolvingConfig (has/get interface).
// Use import.meta.env.* for build-time Vite env values.
const config = {
  boot: { 'banner-mode': 'log' },
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Vue Vite Todo',
    version: '1.0.0',
  },
  logging: {
    level: {
      ROOT: import.meta.env.DEV ? 'debug' : 'info',
    },
  },
};

await vueStarter({
  createApp,
  rootComponent: App,
  selector: '#app',
  contexts: [
    new Context([
      new Singleton(TodoService),
    ]),
  ],
  config,
});
