/**
 * @alt-javascript/boot-flyway — Flyway-inspired migration starter for @alt-javascript/boot.
 *
 * Inspired by Spring Boot's FlywayAutoConfiguration and Flyway OSS (Apache 2.0).
 * Registers a ManagedFlyway CDI bean that calls migrate() on application start,
 * reading all settings from boot.flyway.* config.
 *
 * Usage with jsdbcTemplateStarter:
 *
 *   import '@alt-javascript/jsdbc-sqljs';
 *   import { jsdbcTemplateStarter } from '@alt-javascript/boot-jsdbc';
 *   import { flywayStarter } from '@alt-javascript/boot-flyway';
 *   import { Context } from '@alt-javascript/cdi';
 *
 *   const { applicationContext } = await jsdbcTemplateStarter({
 *     config: {
 *       boot: {
 *         datasource: { url: 'jsdbc:sqljs:memory' },
 *         flyway: { locations: 'db/migration' },
 *       },
 *     },
 *     contexts: [
 *       new Context([...flywayStarter(), new Singleton(UserRepository)]),
 *     ],
 *   });
 *   // Schema is migrated; UserRepository.jsdbcTemplate is wired.
 *
 * Config keys (prefix: boot.flyway):
 *   boot.flyway.enabled              — enable on start (default: true)
 *   boot.flyway.locations            — comma-separated migration paths (default: db/migration)
 *   boot.flyway.table                — history table name (default: flyway_schema_history)
 *   boot.flyway.baseline-on-migrate  — baseline if history empty (default: false)
 *   boot.flyway.baseline-version     — baseline version (default: '1')
 *   boot.flyway.out-of-order         — allow out-of-order (default: false)
 *   boot.flyway.validate-on-migrate  — checksum validation (default: true)
 *   boot.flyway.installed-by         — user in history (default: 'flyway')
 */
import { Boot } from '@alt-javascript/boot';
import {
  flywayAutoConfiguration,
  ManagedFlyway,
  DEFAULT_FLYWAY_PREFIX,
} from './FlywayAutoConfiguration.js';

export { flywayAutoConfiguration, ManagedFlyway, DEFAULT_FLYWAY_PREFIX };

/**
 * Returns CDI component definitions for the Flyway migration runner.
 * Equivalent to flywayAutoConfiguration(options).
 *
 * @param {object} [options]
 * @param {string} [options.prefix]         — config prefix (default: 'boot.flyway')
 * @param {string} [options.datasourceBean] — datasource bean name (default: 'dataSource')
 * @returns {Array} CDI component definitions
 */
export function flywayStarter(options) {
  return flywayAutoConfiguration(options);
}
