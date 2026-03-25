/* eslint-disable import/no-extraneous-dependencies */
import esmImportToUrl from 'rollup-plugin-esm-import-to-url';

const CDN_IMPORTS = {
  '@alt-javascript/common': 'https://cdn.jsdelivr.net/npm/@alt-javascript/common@3/dist/alt-javascript-common-esm.js',
  '@alt-javascript/config': 'https://cdn.jsdelivr.net/npm/@alt-javascript/config@3/dist/alt-javascript-config-esm.js',
};

export default [
  // Monolithic ESM bundle for browser module implementation.
  {
    input: 'browser/index.js',
    treeshake: true,
    plugins: [esmImportToUrl({ imports: CDN_IMPORTS })],
    output: {
      file: 'dist/alt-javascript-logger-esm.js',
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
    input: 'browser/index.js',
    treeshake: true,
    plugins: [esmImportToUrl({ imports: CDN_IMPORTS })],
    output: {
      file: 'dist/alt-javascript-loggerfactory-iife.js',
      format: 'iife',
      name: 'LoggerFactory',
      strict: false,
      externalLiveBindings: false,
      freeze: false,
      sourcemap: false,
      sourcemapExcludeSources: true,
      globals: {
        '@alt-javascript/common': 'AltJavascriptCommon',
        '@alt-javascript/config': 'AltJavascriptConfig',
      },
    },
  },
];
