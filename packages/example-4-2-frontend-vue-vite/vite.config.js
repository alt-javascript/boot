import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

/**
 * Vite config for example-4-2-frontend-vue-vite.
 *
 * No resolve.alias needed: @alt-javascript/* packages declare exports conditions
 * that automatically route bundlers to browser-safe entry points.
 *
 *   @alt-javascript/config  → exports.browser → ./browser/index.js  (no fs/yaml/jasypt)
 *   @alt-javascript/boot    → exports.browser → ./index-browser.js  (no createRequire)
 *   @alt-javascript/logger  → exports.default → ./index.js          (already safe)
 *   @alt-javascript/cdi     → exports.default → ./index.js          (already safe)
 */
export default defineConfig({
  plugins: [vue()],

  build: {
    // Top-level await (used by vueStarter) requires ES2022+.
    // All evergreen browsers have supported it since 2022.
    target: 'esnext',
  },

  test: {
    environment: 'jsdom',
    globals: true,
  },
});
