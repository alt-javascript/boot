/**
 * vite.config.ts — dev server and build config for example-4-4-frontend-angular.
 *
 * Angular packages must be excluded from Vite's pre-bundler (which wraps
 * them as CJS and loses named exports). They are served as native ESM.
 *
 * @analogjs/vite-plugin-angular handles the Angular compiler transform.
 */
import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const angularPackages = [
  '@angular/core',
  '@angular/common',
  '@angular/compiler',
  '@angular/platform-browser',
  '@angular/forms',
];

export default defineConfig({
  plugins: [
    angular({
      tsconfig: resolve(__dirname, 'tsconfig.app.json'),
    }),
  ],

  optimizeDeps: {
    // Angular ESM modules must not be pre-bundled by Vite.
    // Pre-bundling wraps them as CJS and strips named exports.
    exclude: angularPackages,
  },

  build: {
    target: 'esnext',
  },

  test: {
    environment: 'jsdom',
    globals: true,
  },
});
