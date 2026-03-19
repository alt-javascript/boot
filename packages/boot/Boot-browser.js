/* eslint-disable import/extensions */
import { ValueResolvingConfig, EphemeralConfig, ConfigFactory } from '@alt-javascript/config/browser/index.js';
import {
  CachingLoggerFactory, LoggerCategoryCache, LoggerFactory, ConfigurableLogger,
} from '@alt-javascript/logger';
import { getGlobalRef, getGlobalRoot, detectBrowser } from '@alt-javascript/common';

export default class Boot {
  static detectConfig(context) {
    const configArg = context && context.config;
    let $config = null;
    if (!(typeof config === 'undefined')) {
      // eslint-disable-next-line no-undef
      $config = config;
    }
    const browser = detectBrowser();
    if (browser && window?.config) {
      $config = window.config;
    }

    $config = configArg || $config;

    if ($config) {
      if (!($config instanceof ValueResolvingConfig) && ($config.constructor?.name !== 'ValueResolvingConfig')) {
        if (browser) {
          $config = ConfigFactory.getConfig(new EphemeralConfig($config));
        } else {
          $config = ConfigFactory.getConfig($config);
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

    const browser = detectBrowser();

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
        || new LoggerCategoryCache();

    let $loggerFactory = null;
    if (!(typeof loggerFactory === 'undefined')) {
      // eslint-disable-next-line no-undef
      $loggerFactory = loggerFactory;
    }
    $loggerFactory = $loggerFactory
        || loggerFactoryArg
        || new LoggerFactory($config, $loggerCategoryCache, ConfigurableLogger.DEFAULT_CONFIG_PATH);

    let $fetch = null;
    if (!(typeof fetch === 'undefined')) {
      $fetch = fetch;
    }
    $fetch = $fetch || fetchArg;

    const $globalref = getGlobalRef();

    $globalref.boot = { contexts: { root: { config: $config } } };
    $globalref.boot.contexts.root.loggerCategoryCache = $loggerCategoryCache;
    $globalref.boot.contexts.root.loggerFactory = $loggerFactory;
    $globalref.boot.contexts.root.fetch = $fetch;
  }

  static test(context) {
    const $config = Boot.detectConfig(context);
    const loggerCategoryCache = new LoggerCategoryCache();
    const cachingLoggerFactory = new CachingLoggerFactory($config, loggerCategoryCache);
    if ($config.get('logging.test.fixtures.quiet', true)) {
      Boot.boot({ config: $config, loggerFactory: cachingLoggerFactory, loggerCategoryCache });
    } else {
      Boot.boot({ config: $config });
    }
  }

  static root(name, defaultValue) {
    const value = getGlobalRoot(name);
    return value || defaultValue;
  }
}
