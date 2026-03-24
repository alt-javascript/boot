/**
 * vitest.config.js — test-only config, no Angular compiler needed.
 *
 * Service tests are pure JS (no Angular imports) and run in jsdom.
 * The Angular vite plugin (vite.config.ts) is only needed for the dev server.
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
