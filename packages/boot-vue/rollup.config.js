/* eslint-disable import/no-extraneous-dependencies */
import esmImportToUrl from 'rollup-plugin-esm-import-to-url';

export default [
  {
    input: 'index.js',
    treeshake: true,
    plugins: [esmImportToUrl({
      imports: {
        '@alt-javascript/boot': 'https://cdn.jsdelivr.net/npm/@alt-javascript/boot@3/dist/alt-javascript-boot-esm.js',
        '@alt-javascript/cdi': 'https://cdn.jsdelivr.net/npm/@alt-javascript/cdi@3/dist/alt-javascript-cdi-esm.js',
      },
    })],
    output: {
      file: 'dist/alt-javascript-boot-vue-esm.js',
      format: 'esm',
      strict: false,
      externalLiveBindings: false,
      freeze: false,
      sourcemap: false,
      sourcemapExcludeSources: true,
    },
  },
];
