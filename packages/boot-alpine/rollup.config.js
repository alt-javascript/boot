/* eslint-disable import/no-extraneous-dependencies */
import esmImportToUrl from 'rollup-plugin-esm-import-to-url';

/**
 * Rollup build for @alt-javascript/boot-alpine CDN/ESM dist bundle.
 *
 * All @alt-javascript/* dependencies are externalised to jsDelivr CDN URLs.
 * The resulting bundle can be used in an importmap without a build step:
 *
 *   "@alt-javascript/boot-alpine": "https://cdn.jsdelivr.net/npm/@alt-javascript/boot-alpine@3/dist/alt-javascript-boot-alpine-esm.js"
 *
 * Note: alpineStarter() is included in the bundle and calls Boot-browser.js
 * (the browser-safe boot entry) so it works without Node.js built-ins.
 */
export default [
  {
    input: 'index.js',
    treeshake: true,
    plugins: [esmImportToUrl({
      imports: {
        '@alt-javascript/boot':                  'https://cdn.jsdelivr.net/npm/@alt-javascript/boot@3/dist/alt-javascript-boot-esm.js',
        '@alt-javascript/cdi':                   'https://cdn.jsdelivr.net/npm/@alt-javascript/cdi@3/dist/alt-javascript-cdi-esm.js',
        '@alt-javascript/cdi/context/index.js':  'https://cdn.jsdelivr.net/npm/@alt-javascript/cdi@3/dist/alt-javascript-cdi-esm.js',
        '@alt-javascript/config':                'https://cdn.jsdelivr.net/npm/@alt-javascript/config@3/dist/alt-javascript-config-esm.js',
        '@alt-javascript/logger':                'https://cdn.jsdelivr.net/npm/@alt-javascript/logger@3/dist/alt-javascript-logger-esm.js',
        '@alt-javascript/common':                'https://cdn.jsdelivr.net/npm/@alt-javascript/common@3/dist/alt-javascript-common-esm.js',
      },
    })],
    output: {
      file: 'dist/alt-javascript-boot-alpine-esm.js',
      format: 'esm',
      strict: false,
      externalLiveBindings: false,
      freeze: false,
      sourcemap: false,
      sourcemapExcludeSources: true,
    },
  },
];
