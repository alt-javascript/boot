/* eslint-disable import/no-extraneous-dependencies */
import esmImportToUrl from 'rollup-plugin-esm-import-to-url';

export default [
  // Monolithic ESM bundle for browser module implementation.
  {
    input: 'browser/index.js',
    treeshake: true,
    plugins: [esmImportToUrl({
      imports: {
        '@alt-javascript/common': 'https://cdn.jsdelivr.net/npm/@alt-javascript/common@3/dist/alt-javascript-common-esm.js',
      },
    })],
    output: {
      file: 'dist/alt-javascript-config-esm.js',
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
    input: 'browser/ConfigFactory.js',
    treeshake: true,
    plugins: [esmImportToUrl({
      imports: {
        '@alt-javascript/common': 'https://cdn.jsdelivr.net/npm/@alt-javascript/common@3/dist/alt-javascript-common-esm.js',
      },
    })],
    output: {
      file: 'dist/alt-javascript-configfactory-iife.js',
      format: 'iife',
      name: 'ConfigFactory',
      strict: false,
      externalLiveBindings: false,
      freeze: false,
      sourcemap: false,
      sourcemapExcludeSources: true,
      globals: {
        '@alt-javascript/common': 'AltJavascriptCommon',
      },
    },
  },
];
