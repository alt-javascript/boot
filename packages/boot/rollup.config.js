/* eslint-disable import/no-extraneous-dependencies */
import esmImportToUrl from 'rollup-plugin-esm-import-to-url';

export default [
  // Monolithic ESM bundle for browser module implementation.
  {
    input: 'index-browser.js',
    treeshake: true,
    plugins: [esmImportToUrl({
      imports: {
        '@alt-javascript/config/browser/index.js': 'https://cdn.jsdelivr.net/npm/@alt-javascript/config@3/dist/alt-javascript-config-esm.js',
        '@alt-javascript/logger': 'https://cdn.jsdelivr.net/npm/@alt-javascript/logger@3/dist/alt-javascript-logger-esm.js',
        '@alt-javascript/common': 'https://cdn.jsdelivr.net/npm/@alt-javascript/common@3/dist/alt-javascript-common-esm.js',
        '@alt-javascript/cdi': 'https://cdn.jsdelivr.net/npm/@alt-javascript/cdi@3/dist/alt-javascript-cdi-esm.js',
      },
    })],
    output: {
      file: 'dist/alt-javascript-boot-esm.js',
      format: 'esm',
      strict: false,
      externalLiveBindings: false,
      freeze: false,
      sourcemap: false,
      sourcemapExcludeSources: true,
    },
  },
  // IIFE bundle for browsers global import.
  {
    input: 'Application-browser.js',
    treeshake: true,
    plugins: [esmImportToUrl({
      imports: {
        '@alt-javascript/config/browser/index.js': 'https://cdn.jsdelivr.net/npm/@alt-javascript/config@3/dist/alt-javascript-config-esm.js',
        '@alt-javascript/logger': 'https://cdn.jsdelivr.net/npm/@alt-javascript/logger@3/dist/alt-javascript-logger-esm.js',
        '@alt-javascript/common': 'https://cdn.jsdelivr.net/npm/@alt-javascript/common@3/dist/alt-javascript-common-esm.js',
        '@alt-javascript/cdi': 'https://cdn.jsdelivr.net/npm/@alt-javascript/cdi@3/dist/alt-javascript-cdi-esm.js',
        '@alt-javascript/cdi/ApplicationContext': 'https://cdn.jsdelivr.net/npm/@alt-javascript/cdi@3/dist/alt-javascript-cdi-esm.js',
      },
    })],
    output: {
      file: 'dist/alt-javascript-application-iife.js',
      format: 'iife',
      name: 'Application',
      strict: false,
      externalLiveBindings: false,
      freeze: false,
      sourcemap: false,
      sourcemapExcludeSources: true,
    },
  },
];
