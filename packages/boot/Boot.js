import { createRequire } from 'module';
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
    } else if (!browser) {
      // No explicit config provided — use ProfileConfigLoader default (reads application.json etc.)
      $config = ConfigFactory.loadConfig();
    } else {
      throw new Error('Unable to detect config, is \'config\' declared or provided?');
    }
    return $config;
  }

  /**
   * Bootstrap the application: detect config, create logger infrastructure,
   * populate the global boot context, and print the startup banner.
   *
   * When `contexts` is provided, also creates and starts an ApplicationContext,
   * returning the running context. This is the minimal entry-point pattern:
   *
   *   await Boot.boot({ contexts: [context] });
   *
   * @param {object} [context] - { config, contexts, loggerFactory, loggerCategoryCache, fetch }
   * @returns {Promise<ApplicationContext|undefined>} running context if contexts provided
   */
  static async boot(context) {
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

    // Print banner — fires once at boot time, from the boot module (not ApplicationContext).
    // eslint-disable-next-line no-use-before-define
    printBanner($config, $loggerFactory.getLogger('@alt-javascript/boot'));

    // If contexts are provided, start the ApplicationContext and return it.
    if (context && context.contexts) {
      const {
        ApplicationContext, Context, Singleton,
      } = await import('@alt-javascript/cdi');
      // Build a root Context carrying the boot-managed infrastructure singletons
      // (config, loggerFactory, loggerCategoryCache) so CDI beans can autowire them.
      const rootContext = new Context([
        new Singleton({ Reference: $config, name: 'config' }),
        new Singleton({ Reference: $loggerFactory, name: 'loggerFactory' }),
        new Singleton({ Reference: $loggerCategoryCache, name: 'loggerCategoryCache' }),
      ]);
      const appCtx = new ApplicationContext({
        contexts: [rootContext, ...context.contexts],
        config: $config,
      });
      await appCtx.start();
      return appCtx;
    }

    return undefined;
  }

  /**
   * Test bootstrap — uses CachingLoggerFactory to suppress log output during tests,
   * and suppresses the startup banner via a high-priority config overlay.
   * Respects config key `logging.test.fixtures.quiet` (default: true).
   * @param {object} [context] - { config }
   */
  static async test(context) {
    const $config = Boot.detectConfig(context);
    // Overlay forces banner off in all tests without mutating the caller's config
    const testOverlay = new EphemeralConfig({ boot: { 'banner-mode': 'off' } });
    const $testConfig = new PropertySourceChain([testOverlay, $config]);
    const loggerCategoryCache = new LoggerCategoryCache();
    const cachingLoggerFactory = new CachingLoggerFactory($testConfig, loggerCategoryCache);
    if ($config.get('logging.test.fixtures.quiet', true)) {
      await Boot.boot({ config: $testConfig, loggerFactory: cachingLoggerFactory, loggerCategoryCache });
    } else {
      await Boot.boot({ config: $testConfig });
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

// ---------------------------------------------------------------------------
// Banner — lives in Boot, not ApplicationContext.
// Mirrors Spring Boot: prints once at boot time, not per-context.
// ---------------------------------------------------------------------------

const BANNER_ART = `  ____        _ _        _                                _       _    ____  
 / / /   __ _| | |_     (_) __ ___   ____ _ ___  ___ _ __(_)_ __ | |_  \\ \\ \\
/ / /   / _\` | | __|____| |/ _\` \\ \\ / / _\` / __|/ __| '__| | '_ \\| __|  \\ \\ \\
\\ \\ \\  | (_| | | ||_____| | (_| |\\ V / (_| \\__ \\ (__| |  | | |_) | |_   / / /
 \\_\\_\\  \\__,_|_|\\__|   _/ |\\__,_| \\_/ \\__,_|___/\\___|_|  |_| .__/ \\__| /_/_/
                       |__/                                  |_|`;

/**
 * Resolve the banner version from package.json at runtime.
 * Works from source tree and from the dist/ bundle (try/catch fallback).
 * Returns '(browser)' when running in a browser environment.
 */
function buildBanner() {
  if (detectBrowser()) {
    return `${BANNER_ART}\n   @alt-javascript/boot :: (browser)`;
  }
  try {
    const require = createRequire(import.meta.url);
    let pkg;
    try { pkg = require('./package.json'); } catch { pkg = require('../package.json'); }
    return `${BANNER_ART}\n   @alt-javascript/boot :: ${pkg.version || '(unknown)'}`;
  } catch {
    return `${BANNER_ART}\n   @alt-javascript/boot :: (unknown)`;
  }
}

/**
 * Print (or suppress) the startup banner.
 * Reads boot.banner-mode from config: 'console' (default), 'log', 'off'.
 * @param {object} config - resolved config object with has()/get()
 * @param {object} [logger] - optional logger for 'log' mode
 */
export function printBanner(config, logger) {
  const mode = (config && config.has('boot.banner-mode'))
    ? config.get('boot.banner-mode')
    : 'console';

  if (mode === 'off') return;

  const banner = buildBanner();

  if (mode === 'log' && logger) {
    logger.info(banner);
  } else {
    // eslint-disable-next-line no-console
    console.log(banner);
  }
}
