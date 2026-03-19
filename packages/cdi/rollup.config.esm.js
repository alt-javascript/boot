/* eslint-disable import/no-extraneous-dependencies */
import esmImportToUrl from 'rollup-plugin-esm-import-to-url';

export default [
  // Monolithic ESM bundle for browser module implementation.
  {
    input: 'index.js',
    treeshake: true,
    plugins: [esmImportToUrl({
      imports: {
        lodash: 'https://cdn.jsdelivr.net/npm/lodash-es/lodash.min.js',
        '@alt-javascript/config': 'https://cdn.jsdelivr.net/npm/@alt-javascript/config@2/dist/alt-javascript-config-esm.js',
        '@alt-javascript/logger': 'https://cdn.jsdelivr.net/npm/@alt-javascript/logger@2/dist/alt-javascript-logger-esm.js',
      },
    })],

    output: {
      file: 'dist/alt-javascript-cdi-esm.js',
      format: 'esm',
      strict: false,
      externalLiveBindings: false,
      freeze: false,
      sourcemap: false,
      sourcemapExcludeSources: true,
    },
  }];
