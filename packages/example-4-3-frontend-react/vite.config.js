import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite config for example-4-3-frontend-react.
 *
 * No resolve.alias needed: @alt-javascript/* packages declare exports conditions
 * that automatically route bundlers to browser-safe entry points.
 *
 *   @alt-javascript/config → exports.browser → ./browser/index.js  (no fs/yaml/jasypt)
 *   @alt-javascript/boot   → exports.browser → ./index-browser.js  (no createRequire)
 */
export default defineConfig({
  plugins: [react()],

  build: {
    target: 'esnext',
  },

  test: {
    environment: 'jsdom',
    globals: true,
  },
});
