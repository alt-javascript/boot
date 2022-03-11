var alt = (function (indexBrowser_js, logger) {

  class Boot {
    static getGlobalRef() {
      let $globalref = null;
      if (Boot.detectBrowser()) {
        $globalref = window;
      } else {
        $globalref = global;
      }
      return $globalref;
    }

    static getGlobalRoot(key) {
      const $globalref = Boot.getGlobalRef();
      let $key = ($globalref && $globalref.boot);
      $key = $key && $key.contexts;
      $key = $key && $key.root;
      $key = $key && $key[`${key}`];
      return $key;
    }

    static detectBrowser() {
      const browser = !(typeof window === 'undefined');
      return browser;
    }

    static detectConfig(context) {
      const configArg = context && context.config;
      let $config = null;
      if (!(typeof config === 'undefined')) {
        // eslint-disable-next-line no-undef
        $config = config;
      }
      const browser = Boot.detectBrowser();
      if (browser && window?.config) {
        $config = window.config;
      }

      $config = configArg || $config;

      if ($config) {
        if (!($config instanceof indexBrowser_js.ValueResolvingConfig) && ($config.constructor?.name !== 'ValueResolvingConfig')) {
          if (browser) {
            $config = indexBrowser_js.ConfigFactory.getConfig(new indexBrowser_js.EphemeralConfig($config));
          } else {
            $config = indexBrowser_js.ConfigFactory.getConfig($config);
          }
        }
      } else {
        throw new Error('Unable to detect config, is \'config\' declared or provided?');
      }
      return $config;
    }

    static boot(context) {
      const loggerFactoryArg = context && context.loggerFactory;
      const loggerCategoryCacheArg = context && context.loggerFactory;
      const fetchArg = context && context.fetch;

      const browser = !(typeof window === 'undefined');

      let $config = Boot.detectConfig(context);

      let $loggerCategoryCache = null;
      if (!(typeof loggerCategoryCacheArg === 'undefined')) {
        $loggerCategoryCache = loggerCategoryCacheArg;
      }
      if (browser && window?.loggerCategoryCache) {
        $config = window.loggerCategoryCache;
      }

      $loggerCategoryCache = $loggerCategoryCache
          || loggerCategoryCacheArg
          || new logger.LoggerCategoryCache();

      let $loggerFactory = null;
      if (!(typeof loggerFactory === 'undefined')) {
        // eslint-disable-next-line no-undef
        $loggerFactory = loggerFactory;
      }
      $loggerFactory = $loggerFactory
          || loggerFactoryArg
          || new logger.LoggerFactory($config, $loggerCategoryCache, logger.ConfigurableLogger.DEFAULT_CONFIG_PATH);

      let $fetch = null;
      if (!(typeof fetch === 'undefined')) {
        $fetch = fetch;
      }
      $fetch = $fetch || fetchArg;

      const $globalref = Boot.getGlobalRef();

      $globalref.boot = { contexts: { root: { config: $config } } };
      $globalref.boot.contexts.root.loggerCategoryCache = $loggerCategoryCache;
      $globalref.boot.contexts.root.loggerFactory = $loggerFactory;
      $globalref.boot.contexts.root.fetch = $fetch;
    }

    static test(context) {
      const $config = Boot.detectConfig(context);
      const loggerCategoryCache = new logger.LoggerCategoryCache();
      const cachingLoggerFactory = new logger.CachingLoggerFactory($config, loggerCategoryCache);
      if ($config.get('logging.test.fixtures.quiet', true)) {
        Boot.boot({ config: $config, loggerFactory: cachingLoggerFactory, loggerCategoryCache });
      } else {
        Boot.boot({ config: $config });
      }
    }

    static root(name, defaultValue) {
      const value = Boot.getGlobalRoot(name);
      return value || defaultValue;
    }
  }

  /* eslint-disable import/extensions */

  class Application {
    static async run(optionsArg) {
      const options = optionsArg;
      if (!Boot.root('config')) {
        Boot.boot(options);
      }

      // eslint-disable-next-line global-require
      const ApplicationContext = await import('@alt-javascript/cdi/ApplicationContext');

      options.config = options?.config || Boot.root('config');
      let applicationContext = options?.applicationContext || options;
      if (applicationContext.constructor.name !== 'ApplicationContext') {
        applicationContext = new ApplicationContext(options);
      }
      applicationContext.lifeCycle();
      return applicationContext;
    }
  }

  return Application;

})(indexBrowser_js, logger);
