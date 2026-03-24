/**
 * FlywayAutoConfiguration — CDI auto-configuration for Flyway-inspired migrations.
 *
 * Registers a Flyway bean that runs migrate() on application start.
 * Reads all configuration from boot.flyway.* (configurable prefix).
 *
 * Config keys:
 *   {prefix}.enabled              — enable migration on start (default: true)
 *   {prefix}.locations            — comma-separated migration paths (default: db/migration)
 *   {prefix}.table                — history table name (default: flyway_schema_history)
 *   {prefix}.baseline-on-migrate  — run baseline() if history is empty (default: false)
 *   {prefix}.baseline-version     — version for baseline (default: '1')
 *   {prefix}.baseline-description — baseline description
 *   {prefix}.out-of-order         — allow out-of-order migrations (default: false)
 *   {prefix}.validate-on-migrate  — validate checksums before migrating (default: true)
 *   {prefix}.installed-by         — user recorded in history (default: 'flyway')
 *   {prefix}.clean-disabled       — prevent clean() from running (default: true, safety guard)
 *   {prefix}.datasource           — name of the dataSource bean to use (default: 'dataSource')
 */
import { conditionalOnProperty } from '@alt-javascript/cdi';
import { Flyway } from '@alt-javascript/flyway';

export const DEFAULT_FLYWAY_PREFIX = 'boot.flyway';

/**
 * CDI-managed Flyway runner. Reads configuration from the application context
 * and triggers migrate() during the init lifecycle phase.
 */
export class ManagedFlyway {
  constructor() {
    this.dataSource = null;           // explicit wire — name resolved from config
    this._applicationContext = null;
    this._prefix = DEFAULT_FLYWAY_PREFIX;
    this._flyway = null;
    this._migratePromise = null;      // awaitable — CDI init() is not awaited by the framework
  }

  setApplicationContext(ctx) {
    this._applicationContext = ctx;
  }

  init() {
    // CDI does not await async init() — store the promise so callers can await it
    this._migratePromise = this._migrate();
    return this._migratePromise;
  }

  /**
   * Wait for migration to complete. Use after context.start() to ensure
   * migrations have fully applied before querying.
   * @returns {Promise<void>}
   */
  async ready() {
    if (this._migratePromise) await this._migratePromise;
  }

  async _migrate() {
    const config = this._applicationContext.config;
    const p = this._prefix;

    if (config.has(`${p}.enabled`) && !config.get(`${p}.enabled`)) {
      return;
    }

    const locationsRaw = config.has(`${p}.locations`)
      ? config.get(`${p}.locations`)
      : 'db/migration';
    const locations = String(locationsRaw).split(',').map((s) => s.trim());

    this._flyway = new Flyway({
      dataSource: this.dataSource,
      locations,
      table: config.has(`${p}.table`) ? config.get(`${p}.table`) : undefined,
      baselineVersion: config.has(`${p}.baseline-version`) ? config.get(`${p}.baseline-version`) : undefined,
      baselineDescription: config.has(`${p}.baseline-description`) ? config.get(`${p}.baseline-description`) : undefined,
      outOfOrder: config.has(`${p}.out-of-order`) ? config.get(`${p}.out-of-order`) : false,
      validateOnMigrate: config.has(`${p}.validate-on-migrate`) ? config.get(`${p}.validate-on-migrate`) : true,
      installedBy: config.has(`${p}.installed-by`) ? config.get(`${p}.installed-by`) : undefined,
    });

    const baselineOnMigrate = config.has(`${p}.baseline-on-migrate`)
      && config.get(`${p}.baseline-on-migrate`);

    if (baselineOnMigrate) {
      const history = this._flyway._history;
      await history.provision();
      const existing = await history.findAll();
      if (existing.length === 0) {
        await this._flyway.baseline();
      }
    }

    await this._flyway.migrate();
  }

  /**
   * Expose the underlying Flyway instance for info(), validate(), repair() etc.
   * @returns {Flyway|null}
   */
  getFlyway() {
    return this._flyway;
  }
}

/**
 * Returns CDI component definitions that auto-configure Flyway migration.
 *
 * All components are conditional on {prefix}.locations or datasource URL presence.
 *
 * @param {object} [options]
 * @param {string} [options.prefix='boot.flyway']    — config key prefix
 * @param {string} [options.datasourceBean='dataSource'] — CDI bean name to wire as datasource
 * @returns {Array} CDI component definitions
 */
export function flywayAutoConfiguration(options = {}) {
  const prefix = options.prefix ?? DEFAULT_FLYWAY_PREFIX;
  const datasourceBean = options.datasourceBean ?? 'dataSource';

  class BoundManagedFlyway extends ManagedFlyway {
    constructor() {
      super();
      this._prefix = prefix;
      this.dataSource = null; // wired explicitly below
    }
  }
  Object.defineProperty(BoundManagedFlyway, 'name', { value: 'managedFlyway' });

  return [
    {
      name: 'managedFlyway',
      Reference: BoundManagedFlyway,
      scope: 'singleton',
      properties: [{ name: 'dataSource', reference: datasourceBean }],
      dependsOn: datasourceBean,
      condition: (config) => {
        if (config.has(`${prefix}.enabled`) && !config.get(`${prefix}.enabled`)) return false;
        // Register if we have a datasource — flyway needs something to migrate
        return config.has('boot.datasource.url') || config.has(`${prefix}.locations`);
      },
    },
  ];
}
