/**
 * @alt-javascript/boot-jsnosqlc — CDI auto-configuration starter for jsnosqlc.
 *
 * Wires a jsnosqlc Client into the application CDI context from config.
 * No template layer — Collection is the high-level API for NoSQL.
 *
 * Usage:
 *
 *   import '@alt-javascript/jsnosqlc-memory'; // self-registers driver
 *   import { jsnosqlcStarter } from '@alt-javascript/boot-jsnosqlc';
 *   import { Context, Singleton } from '@alt-javascript/cdi';
 *
 *   const { applicationContext } = await jsnosqlcStarter({
 *     config: {
 *       boot: { nosql: { url: 'jsnosqlc:memory:' } },
 *     },
 *     contexts: [new Context([new Singleton(UserRepository)])],
 *   });
 *
 *   // UserRepository.nosqlClient is autowired.
 *   // Call client.ready() then client.getCollection('users') to query.
 *
 * Config keys (prefix: boot.nosql):
 *   boot.nosql.url       — jsnosqlc driver URL (required)
 *   boot.nosql.username  — optional credential
 *   boot.nosql.password  — optional credential
 *
 * Multi-datasource — use NoSqlClientBuilder:
 *
 *   import { NoSqlClientBuilder } from '@alt-javascript/boot-jsnosqlc';
 *
 *   const sessionComponents = NoSqlClientBuilder.create()
 *     .prefix('boot.nosql-sessions')
 *     .beanNames({ clientDataSource: 'sessionClientDataSource', client: 'sessionClient' })
 *     .build();
 */
import { Boot } from '@alt-javascript/boot';
import {
  jsnosqlcAutoConfiguration,
  ConfiguredClientDataSource,
  ManagedNosqlClient,
  NoSqlClientBuilder,
  DEFAULT_NOSQL_PREFIX,
} from './JsnosqlcAutoConfiguration.js';

export {
  jsnosqlcAutoConfiguration,
  ConfiguredClientDataSource,
  ManagedNosqlClient,
  NoSqlClientBuilder,
  DEFAULT_NOSQL_PREFIX,
};

/**
 * Returns CDI component definitions for the primary NoSQL client.
 * @param {object} [options]
 * @returns {Array}
 */
export function jsnosqlcStarter(options) {
  return jsnosqlcAutoConfiguration(options);
}

/**
 * Boot the application with jsnosqlc auto-configuration.
 *
 * Wraps Boot.boot(), appending jsnosqlcAutoConfiguration() to the provided contexts.
 * The primary nosqlClient bean is registered when boot.nosql.url is present in config.
 *
 * @param {object} [options] — Boot.boot() options
 * @param {Array}  [options.contexts] — additional CDI contexts
 * @param {object} [options.config]   — config object or EphemeralConfig-compatible map
 * @returns {Promise<{ applicationContext }>}
 */
export async function jsnosqlcBoot(options = {}) {
  const { contexts = [], ...rest } = options;
  const { Context } = await import('@alt-javascript/cdi');
  const autoConfig = new Context(jsnosqlcAutoConfiguration());
  return Boot.boot({ ...rest, contexts: [...contexts, autoConfig] });
}
