export default [
  // Monolithic ESM bundle for browser module implementation.
  {
    input: 'index-browser.js',
    treeshake: true,
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
