export default [
  // IIFE bundle for browsers global import.
  {
    input: 'ApplicationContext.js',
    treeshake: true,
    output: {
      file: 'dist/alt-javascript-applicationcontext-iife.js',
      format: 'iife',
      name: 'ApplicationContext',
      strict: false,
      externalLiveBindings: false,
      freeze: false,
      sourcemap: false,
      sourcemapExcludeSources: true,
      globals: {
        lodash: '_',
        '@alt-javascript/config/ConfigFactory.js': 'ConfigFactory',
        '@alt-javascript/logger/LoggerFactory.js': 'LoggerFactory',
      },
    },
  },
];
