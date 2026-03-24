/**
 * @alt-javascript/boot-jsdbc — Persistence starter for the alt-javascript framework.
 *
 * Auto-configures DataSource, JsdbcTemplate, and NamedParameterJsdbcTemplate
 * as CDI beans from `jsdbc.*` config properties, following Spring Boot's
 * DataSourceAutoConfiguration pattern.
 *
 * The starter is driver-agnostic. Import the jsdbc driver package alongside
 * this starter — drivers self-register with DriverManager on import:
 *
 *   import '@alt-javascript/jsdbc-sqljs';   // SQLite via sql.js (browser + Node)
 *   import '@alt-javascript/jsdbc-sqlite';  // SQLite via better-sqlite3 (Node only)
 *   import '@alt-javascript/jsdbc-pg';      // PostgreSQL
 *   import '@alt-javascript/jsdbc-mysql';   // MySQL / MariaDB
 *
 * Usage:
 *   import '@alt-javascript/jsdbc-sqljs';
 *   import { jsdbcTemplateStarter } from '@alt-javascript/boot-jsdbc';
 *   import { Context, Singleton } from '@alt-javascript/cdi';
 *
 *   const { applicationContext } = await jsdbcTemplateStarter({
 *     contexts: [new Context([new Singleton(UserRepository)])],
 *     config: {
 *       app: { name: 'my-app' },
 *       jsdbc: { url: 'jsdbc:sqljs:memory' },
 *     },
 *   });
 *
 *   const repo = applicationContext.get('userRepository');
 *   // repo.jsdbcTemplate is auto-wired — ready to use
 *
 * Config keys (all under `jsdbc.*`):
 *   jsdbc.url                       — JSDBC connection URL (required)
 *   jsdbc.username                  — database username (optional)
 *   jsdbc.password                  — database password (optional)
 *   jsdbc.pool.enabled              — enable connection pooling (default: false)
 *   jsdbc.pool.min                  — min pool size (default: 0)
 *   jsdbc.pool.max                  — max pool size (default: 10)
 *   jsdbc.pool.acquireTimeoutMillis — acquire timeout ms (default: 30000)
 *   jsdbc.pool.idleTimeoutMillis    — idle timeout ms (default: 30000)
 *
 * Beans registered in CDI context:
 *   dataSource                   — ConfiguredDataSource (reads jsdbc.* from config)
 *   jsdbcTemplate                — JsdbcTemplate wrapping dataSource
 *   namedParameterJsdbcTemplate  — NamedParameterJsdbcTemplate wrapping dataSource
 *
 * All three are conditional on `jsdbc.url` being present in config.
 * An existing `dataSource` bean is never replaced.
 */
import { Boot } from '@alt-javascript/boot';
import {
  jsdbcAutoConfiguration,
  JsdbcTemplate,
  NamedParameterJsdbcTemplate,
  ConfiguredDataSource,
} from '@alt-javascript/jsdbc-template';

/**
 * Returns the CDI component definitions that register JSDBC beans.
 *
 * Use this when you want to compose the components yourself (e.g. passing
 * them to `new Context([...jsdbcStarter(), ...yourComponents])`).
 *
 * Equivalent to `jsdbcAutoConfiguration()` from `@alt-javascript/jsdbc-template`
 * but re-exported here for a single import point.
 *
 * @returns {Array} CDI component definitions
 */
export function jsdbcStarter() {
  return jsdbcAutoConfiguration();
}

/**
 * Boot the application with JSDBC auto-configuration.
 *
 * Calls `Boot.boot()` with `jsdbcAutoConfiguration()` prepended to the provided
 * contexts. Equivalent to calling `Boot.boot()` directly with `jsdbcStarter()`
 * merged into contexts, but more ergonomic for the common case.
 *
 * @param {object} options
 * @param {Array}  options.contexts  — CDI Context array (your components)
 * @param {object} [options.config]  — config object (POJO or IConfig instance)
 * @param {object} [options.startOptions] — forwarded to ApplicationContext.start()
 * @returns {Promise<{applicationContext: ApplicationContext}>}
 */
export async function jsdbcTemplateStarter(options) {
  const { contexts = [], config, startOptions } = options;

  // User contexts go FIRST so any custom dataSource bean is registered before
  // jsdbcAutoConfiguration() evaluates its condition (which checks !components.dataSource).
  // jsdbcAutoConfiguration() then sees the existing bean and skips its own dataSource.
  const applicationContext = await Boot.boot({
    config,
    contexts: [...contexts, jsdbcAutoConfiguration()],
    run: false,
    ...startOptions,
  });

  return { applicationContext };
}

// Re-export template classes for convenience — callers only need this package
// alongside a driver package.
export {
  JsdbcTemplate,
  NamedParameterJsdbcTemplate,
  ConfiguredDataSource,
  jsdbcAutoConfiguration,
};

/** @deprecated Use jsdbcTemplateStarter() */
export const jsdbcAutoConfigurationStarter = jsdbcTemplateStarter;
