/* eslint-disable import/no-extraneous-dependencies */
import esmImportToUrl from 'rollup-plugin-esm-import-to-url';

export default [
  {
    input: 'index.js',
    treeshake: true,
    external: ['node:fs', 'node:path'],
    plugins: [esmImportToUrl({
      imports: {
        lodash: 'https://cdn.jsdelivr.net/npm/lodash-es/lodash.min.js',
        '@alt-javascript/config': 'https://cdn.jsdelivr.net/npm/@alt-javascript/config@3/dist/alt-javascript-config-esm.js',
        '@alt-javascript/logger': 'https://cdn.jsdelivr.net/npm/@alt-javascript/logger@3/dist/alt-javascript-logger-esm.js',
        '@alt-javascript/common': 'https://cdn.jsdelivr.net/npm/@alt-javascript/common@3/dist/alt-javascript-common-esm.js',
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
