/**
 * example-4-2-frontend-vue-vite — application entry point
 *
 * vueStarter() boots CDI then mounts the Vue SFC root component.
 * Config uses BrowserProfileResolver to map URL → active profile,
 * then ProfileAwareConfig to overlay profile-specific values.
 *
 *   localhost:5173   → dev   (green badge)
 *   127.0.0.1:5173   → local (blue badge)
 *
 * Open both URLs to see the profile badge and app.env value change.
 */
import { createApp } from 'vue';
import { vueStarter } from '@alt-javascript/boot-vue';
import { BrowserProfileResolver, ProfileAwareConfig } from '@alt-javascript/config';
import { Context, Singleton } from '@alt-javascript/cdi';
import App from './src/App.vue';
import { TodoService } from './src/services.js';

// Config POJO with URL → profile mapping and per-profile overrides.
const configObject = {
  boot: { 'banner-mode': 'log' },
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Vue Vite Todo',
    version: '1.0.0',
    env: 'default',
  },
  logging: {
    level: { ROOT: 'info' },
  },
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
};

// Resolve active profiles from the current browser URL.
// Boot.boot() receives a ProfileAwareConfig that already has has()/get() —
// duck-typed as a config object, passed through without re-wrapping.
const activeProfiles = BrowserProfileResolver.resolve({
  urlMappings: configObject.profiles.urls,
});
const config = new ProfileAwareConfig(configObject, activeProfiles);

await vueStarter({
  createApp,
  rootComponent: App,
  selector: '#app',
  contexts: [
    new Context([new Singleton(TodoService)]),
  ],
  config,
  // Pass resolved profile info as props to the root component via provide.
  onReady(vueApp) {
    vueApp.provide('activeProfile', activeProfiles[0] || 'default');
    vueApp.provide('appEnv', config.get('app.env', 'default'));
  },
});
