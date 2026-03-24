/* eslint-disable import/extensions */
/**
 * Boot-browser.js — browser-facing Boot implementation.
 *
 * Mirrors Boot.js but targets browser ESM bundles.
 * Config source: explicit options.config (POJO or config object) → window.config.
 * CDI: delegated to @alt-javascript/cdi ApplicationContext (loaded dynamically).
 * Banner: suppressed by default in browser (no console spam on CDN pages).
 */
import { ValueResolvingConfig, EphemeralConfig, ConfigFactory } from '@alt-javascript/config/browser/index.js';
import {
  LoggerCategoryCache, LoggerFactory, ConfigurableLogger,
} from '@alt-javascript/logger';
import { getGlobalRef, getGlobalRoot, detectBrowser } from '@alt-javascript/common';

export default class Boot {
  /**
   * Detect and resolve config from: explicit options.config → window.config.
   * Wraps plain POJOs in ValueResolvingConfig automatically.
   */
  static detectConfig(options) {
    const configArg = options && options.config;
    let $config = null;

    if (typeof window !== 'undefined' && window?.config) {
      $config = window.config;
    }

    $config = configArg || $config;

    if ($config) {
      // Duck-type: pass through if already a config interface
      if (typeof $config.has !== 'function' || typeof $config.get !== 'function') {
        $config = ConfigFactory.getConfig(new EphemeralConfig($config));
      }
    } else {
      throw new Error("Unable to detect config. Pass config: { ... } to Boot.boot().");
    }
    return $config;
  }

  /**
   * Bootstrap the application for browser environments.
   *
   * Accepts identical options to the Node Boot.js:
   *   { config, contexts, run, loggerFactory, loggerCategoryCache, fetch }
   *
   * config may be a plain POJO — wrapped automatically.
   * run defaults to true; pass run: false to skip the CDI run phase.
   *
   * @param {object} [options]
   * @returns {Promise<ApplicationContext|undefined>}
   */
  static async boot(options) {
    const loggerFactoryArg     = options && options.loggerFactory;
    const loggerCategoryCacheArg = options && options.loggerCategoryCache;
    const fetchArg             = options && options.fetch;

    // Normalise run: undefined/null → true; string 'false' → false
    let runPhase = true;
    if (options && options.run !== undefined && options.run !== null) {
      runPhase = (typeof options.run === 'string')
        ? options.run.toLowerCase() !== 'false'
        : Boolean(options.run);
    }

    const $config = Boot.detectConfig(options);

    let $loggerCategoryCache = loggerCategoryCacheArg
      || (typeof window !== 'undefined' && window?.loggerCategoryCache)
      || new LoggerCategoryCache();

    let $loggerFactory = loggerFactoryArg
      || new LoggerFactory($config, $loggerCategoryCache, ConfigurableLogger.DEFAULT_CONFIG_PATH);

    let $fetch = fetchArg;
    if (typeof fetch !== 'undefined') $fetch = $fetch || fetch; // eslint-disable-line no-undef

    const $globalref = getGlobalRef();
    $globalref.boot = { contexts: { root: { config: $config } } };
    $globalref.boot.contexts.root.loggerCategoryCache = $loggerCategoryCache;
    $globalref.boot.contexts.root.loggerFactory       = $loggerFactory;
    $globalref.boot.contexts.root.fetch               = $fetch;

    // Boot the CDI ApplicationContext if contexts were provided
    if (options && options.contexts) {
      const { ApplicationContext, Context, Singleton } = await import('@alt-javascript/cdi');
      const rootContext = new Context([
        new Singleton({ Reference: $config,              name: 'config' }),
        new Singleton({ Reference: $loggerFactory,       name: 'loggerFactory' }),
        new Singleton({ Reference: $loggerCategoryCache, name: 'loggerCategoryCache' }),
      ]);
      const appCtx = new ApplicationContext({
        contexts: [rootContext, ...options.contexts],
        config: $config,
      });
      await appCtx.start({ run: runPhase });
      return appCtx;
    }

    return undefined;
  }

  static root(name, defaultValue) {
    const value = getGlobalRoot(name);
    return value || defaultValue;
  }

  /** Browser stub — Boot.test() is only used in Node test suites */
  static test() {
    throw new Error('Boot.test() is not available in browser builds.');
  }
}
