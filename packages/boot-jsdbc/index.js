/**
 * @alt-javascript/boot-jsdbc — Persistence starter for the alt-javascript framework.
 *
 * Auto-configures DataSource, JsdbcTemplate, NamedParameterJsdbcTemplate, and
 * SchemaInitializer as CDI beans from boot.datasource.* config properties,
 * following Spring Boot's DataSourceAutoConfiguration pattern.
 *
 * The starter is driver-agnostic. Import the jsdbc driver package alongside
 * this starter — drivers self-register with DriverManager on import:
 *
 *   import '@alt-javascript/jsdbc-sqljs';   // SQLite via sql.js (browser + Node)
 *   import '@alt-javascript/jsdbc-sqlite';  // SQLite via better-sqlite3 (Node only)
 *   import '@alt-javascript/jsdbc-pg';      // PostgreSQL
 *   import '@alt-javascript/jsdbc-mysql';   // MySQL / MariaDB
 *
 * Primary datasource usage:
 *   import '@alt-javascript/jsdbc-sqljs';
 *   import { jsdbcTemplateStarter } from '@alt-javascript/boot-jsdbc';
 *
 *   const { applicationContext } = await jsdbcTemplateStarter({
 *     contexts: [new Context([new Singleton(UserRepository)])],
 *     config: {
 *       app: { name: 'my-app' },
 *       boot: { datasource: { url: 'jsdbc:sqljs:memory' } },
 *     },
 *   });
 *
 * Secondary (named) datasource usage:
 *   import { DataSourceBuilder } from '@alt-javascript/boot-jsdbc';
 *
 *   const reportingComponents = DataSourceBuilder
 *     .create()
 *     .prefix('boot.datasource.reporting')
 *     .beanNames({ dataSource: 'reportingDataSource', jsdbcTemplate: 'reportingJsdbcTemplate' })
 *     .build();
 *
 * Schema/data initialisation:
 *   - SchemaInitializer runs config/schema.sql then config/data.sql on start
 *   - Disable with boot.datasource.initialize = false
 *   - Custom paths via boot.datasource.schema / boot.datasource.data
 *
 * Config keys (default prefix 'boot.datasource'):
 *   boot.datasource.url                       — JSDBC connection URL (required)
 *   boot.datasource.username                  — database username (optional)
 *   boot.datasource.password                  — database password (optional)
 *   boot.datasource.initialize                — run schema/data SQL on start (default: true)
 *   boot.datasource.schema                    — path to schema SQL (default: config/schema.sql)
 *   boot.datasource.data                      — path to data SQL (default: config/data.sql)
 *   boot.datasource.pool.enabled              — enable connection pooling (default: false)
 *   boot.datasource.pool.min                  — min pool size (default: 0)
 *   boot.datasource.pool.max                  — max pool size (default: 10)
 *   boot.datasource.pool.acquireTimeoutMillis — acquire timeout ms (default: 30000)
 *   boot.datasource.pool.idleTimeoutMillis    — idle timeout ms (default: 30000)
 */
import { Boot } from '@alt-javascript/boot';
import { JsdbcTemplate, NamedParameterJsdbcTemplate } from '@alt-javascript/jsdbc-template';
import {
  jsdbcAutoConfiguration,
  ConfiguredDataSource,
  DataSourceBuilder,
  SchemaInitializer,
  DEFAULT_PREFIX,
} from './JsdbcAutoConfiguration.js';

export { JsdbcTemplate, NamedParameterJsdbcTemplate };
export {
  jsdbcAutoConfiguration,
  ConfiguredDataSource,
  DataSourceBuilder,
  SchemaInitializer,
  DEFAULT_PREFIX,
};

/**
 * Returns CDI component definitions for the primary datasource.
 * Equivalent to jsdbcAutoConfiguration(options).
 *
 * @param {object} [options]
 * @param {string} [options.prefix='boot.datasource'] — config key prefix
 * @returns {Array} CDI component definitions
 */
export function jsdbcStarter(options) {
  return jsdbcAutoConfiguration(options);
}

/**
 * Boot the application with JSDBC auto-configuration.
 *
 * @param {object} options
 * @param {Array}  options.contexts    — CDI Context array (your components)
 * @param {object} [options.config]   — config object (POJO or IConfig instance)
 * @param {string} [options.prefix]   — config prefix (default: 'boot.datasource')
 * @param {object} [options.startOptions] — forwarded to ApplicationContext.start()
 * @returns {Promise<{applicationContext: ApplicationContext}>}
 */
export async function jsdbcTemplateStarter(options) {
  const { contexts = [], config, prefix, startOptions } = options;

  // User contexts go FIRST so any custom dataSource bean is registered before
  // jsdbcAutoConfiguration() evaluates its condition (which checks !components.dataSource).
  const applicationContext = await Boot.boot({
    config,
    contexts: [...contexts, jsdbcAutoConfiguration({ prefix })],
    run: false,
    ...startOptions,
  });

  return { applicationContext };
}

/** @deprecated Use jsdbcTemplateStarter() */
export const jsdbcAutoConfigurationStarter = jsdbcTemplateStarter;
