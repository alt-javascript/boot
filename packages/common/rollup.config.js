export default [
  // Monolithic ESM bundle for browser module implementation.
  {
    input: 'index.js',
    treeshake: true,
    output: {
      file: 'dist/alt-javascript-common-esm.js',
      format: 'esm',
      strict: false,
      externalLiveBindings: false,
      freeze: false,
      sourcemap: false,
      sourcemapExcludeSources: true,
    },
  },
];
