import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Root of the monorepo workspace
const root = resolve(__dirname, '../..');

export default defineConfig({
  plugins: [vue()],

  resolve: {
    alias: [
      // Use the browser-safe config entry (no fs/path/yaml/jasypt).
      // Must be listed before the bare @alt-javascript/config alias.
      {
        find: /^@alt-javascript\/config\/browser\/index\.js$/,
        replacement: resolve(root, 'packages/config/browser/index.js'),
      },
      {
        find: '@alt-javascript/config',
        replacement: resolve(root, 'packages/config/browser/index.js'),
      },
      // Use Boot-browser.js (async boot, no createRequire, no fs).
      {
        find: '@alt-javascript/boot',
        replacement: resolve(root, 'packages/boot/index-browser.js'),
      },
      // Use the browser-safe no-op for logger (no CachingLoggerFactory/crypto).
      // boot-logger is fine as-is (LoggerFactory + LoggerCategoryCache only).
      // Stub @alt-javascript/jasypt to prevent crypto.getHashes errors.
      {
        find: '@alt-javascript/jasypt',
        replacement: resolve(__dirname, 'src/jasypt-browser-stub.js'),
      },
    ],
  },

  test: {
    environment: 'jsdom',
    globals: true,
  },
});
