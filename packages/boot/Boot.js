import { ValueResolvingConfig, EphemeralConfig, ConfigFactory, PropertySourceChain } from '@alt-javascript/config';
import {
  CachingLoggerFactory, LoggerCategoryCache, LoggerFactory, ConfigurableLogger,
} from '@alt-javascript/logger';
import { getGlobalRef, getGlobalRoot, detectBrowser } from '@alt-javascript/common';

/**
 * Application bootstrap utility.
 *
 * Detects the runtime environment (Node/browser), resolves config from global scope
 * or explicit arguments, and initialises `global.boot.contexts.root` with
 * {config, loggerFactory, loggerCategoryCache, fetch}.
 *
 * Entry points:
 * - `Boot.boot(context)` — production bootstrap
 * - `Boot.test(context)` — test bootstrap with CachingLoggerFactory (suppresses log noise)
 * - `Boot.root(name)` — read from the global boot context
 *
 * @example
 * import config from 'config';
 * Boot.boot({ config });
 * // global.boot.contexts.root is now populated
 */
export default class Boot {
  /**
   * Detect and resolve config from: explicit argument → global `config` → window.config.
   * Wraps plain objects in ValueResolvingConfig automatically.
   * @param {object} [context] - optional context with config property
   * @returns {ValueResolvingConfig} resolved config
   * @throws {Error} if no config can be detected
   */
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
      // Duck-type: pass through anything that already implements the config interface
      // (ValueResolvingConfig, ProfileAwareConfig, EphemeralConfig, etc.).
      // Only wrap plain POJOs that lack has()/get().
      if (typeof $config.has !== 'function' || typeof $config.get !== 'function') {
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

  /**
   * Bootstrap the application: detect config, create logger infrastructure,
   * and populate the global boot context.
   * @param {object} [context] - { config, loggerFactory, loggerCategoryCache, fetch }
   */
  static boot(context) {
    const loggerFactoryArg = context && context.loggerFactory;
    const loggerCategoryCacheArg = context && context.loggerCategoryCache;
    const fetchArg = context && context.fetch;

    const browser = detectBrowser();

    let $config = Boot.detectConfig(context);

    let $loggerCategoryCache = null;
    if (!(typeof loggerCategoryCacheArg === 'undefined')) {
      $loggerCategoryCache = loggerCategoryCacheArg;
    }
    if (browser && window?.loggerCategoryCache) {
      $loggerCategoryCache = window.loggerCategoryCache;
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

  /**
   * Test bootstrap — uses CachingLoggerFactory to suppress log output during tests,
   * and suppresses the startup banner via a high-priority config overlay.
   * Respects config key `logging.test.fixtures.quiet` (default: true).
   * @param {object} [context] - { config }
   */
  static test(context) {
    const $config = Boot.detectConfig(context);
    // Overlay forces banner off in all tests without mutating the caller's config
    const testOverlay = new EphemeralConfig({ boot: { 'banner-mode': 'off' } });
    const $testConfig = new PropertySourceChain([testOverlay, $config]);
    const loggerCategoryCache = new LoggerCategoryCache();
    const cachingLoggerFactory = new CachingLoggerFactory($testConfig, loggerCategoryCache);
    if ($config.get('logging.test.fixtures.quiet', true)) {
      Boot.boot({ config: $testConfig, loggerFactory: cachingLoggerFactory, loggerCategoryCache });
    } else {
      Boot.boot({ config: $testConfig });
    }
  }

  /**
   * Read a value from the global boot root context.
   * @param {string} name - property name (e.g. 'config', 'loggerFactory')
   * @param {*} [defaultValue] - returned if not found
   * @returns {*}
   */
  static root(name, defaultValue) {
    const value = getGlobalRoot(name);
    return value || defaultValue;
  }
}
