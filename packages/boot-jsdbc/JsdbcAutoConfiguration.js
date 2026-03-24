/**
 * JsdbcAutoConfiguration — CDI auto-configuration for JSDBC.
 *
 * Config prefix defaults to 'boot.datasource' (aligned with Spring's
 * spring.datasource.*). Custom prefix supported for secondary datasources.
 *
 * Config keys (substitute your prefix):
 *   {prefix}.url                       — JSDBC connection URL (required)
 *   {prefix}.username                  — database username (optional)
 *   {prefix}.password                  — database password (optional)
 *   {prefix}.initialize                — run schema.sql + data.sql on start (default: true)
 *   {prefix}.schema                    — path to schema SQL file (default: 'config/schema.sql')
 *   {prefix}.data                      — path to data SQL file (default: 'config/data.sql')
 *   {prefix}.pool.enabled              — enable connection pooling (default: false)
 *   {prefix}.pool.min                  — min pool size (default: 0)
 *   {prefix}.pool.max                  — max pool size (default: 10)
 *   {prefix}.pool.acquireTimeoutMillis — acquire timeout ms (default: 30000)
 *   {prefix}.pool.idleTimeoutMillis    — idle timeout ms (default: 30000)
 */
import { readFileSync, existsSync } from 'fs';
import { conditionalOnProperty } from '@alt-javascript/cdi';
import { DataSource, PooledDataSource, SingleConnectionDataSource } from '@alt-javascript/jsdbc-core';
import { JsdbcTemplate, NamedParameterJsdbcTemplate } from '@alt-javascript/jsdbc-template';

export const DEFAULT_PREFIX = 'boot.datasource';

/**
 * CDI-managed DataSource. Reads connection properties from config at the
 * given prefix. Implements setApplicationContext for lifecycle access.
 */
export class ConfiguredDataSource {
  constructor() {
    this._delegate = null;
    this._applicationContext = null;
    this._prefix = DEFAULT_PREFIX; // overridden by DataSourceBuilder
    this._connectionPromise = null; // mutex: prevents concurrent getConnection() from creating two connections
  }

  setApplicationContext(ctx) {
    this._applicationContext = ctx;
  }

  init() {
    const config = this._applicationContext.config;
    const p = this._prefix;
    const url = config.get(`${p}.url`);
    const props = { url };

    if (config.has(`${p}.username`)) props.username = config.get(`${p}.username`);
    if (config.has(`${p}.password`)) props.password = config.get(`${p}.password`);

    const poolEnabled = config.has(`${p}.pool.enabled`) && config.get(`${p}.pool.enabled`);

    if (poolEnabled) {
      const pool = {};
      if (config.has(`${p}.pool.min`)) pool.min = config.get(`${p}.pool.min`);
      if (config.has(`${p}.pool.max`)) pool.max = config.get(`${p}.pool.max`);
      if (config.has(`${p}.pool.acquireTimeoutMillis`)) {
        pool.acquireTimeoutMillis = config.get(`${p}.pool.acquireTimeoutMillis`);
      }
      if (config.has(`${p}.pool.idleTimeoutMillis`)) {
        pool.idleTimeoutMillis = config.get(`${p}.pool.idleTimeoutMillis`);
      }
      props.pool = pool;
      this._delegate = new PooledDataSource(props);
    } else if (this._isInMemoryUrl(url)) {
      this._delegate = new SingleConnectionDataSource(props);
    } else {
      this._delegate = new DataSource(props);
    }
  }

  /**
   * Get a connection from the underlying datasource.
   *
   * For SingleConnectionDataSource (in-memory), concurrent callers share one
   * connection. A promise-mutex ensures only one connection is ever created
   * even when multiple async callers race to getConnection() simultaneously.
   *
   * @returns {Promise<Connection>}
   */
  async getConnection() {
    // Fast path: delegate is not a SingleConnectionDataSource (pool or regular DS)
    if (!(this._delegate instanceof SingleConnectionDataSource)) {
      return this._delegate.getConnection();
    }
    // Mutex path: share one initialization promise across concurrent callers
    if (!this._connectionPromise) {
      this._connectionPromise = this._delegate.getConnection();
    }
    return this._connectionPromise;
  }

  /** @returns {string} */
  getUrl() {
    return this._delegate.getUrl?.() || this._delegate._url;
  }

  async destroy() {
    if (this._delegate && typeof this._delegate.destroy === 'function') {
      await this._delegate.destroy();
    }
  }

  _isInMemoryUrl(url) {
    return url.includes(':memory') || url.includes('::memory:');
  }
}

/**
 * SchemaInitializer — runs schema.sql then data.sql on application start.
 *
 * Controlled by {prefix}.initialize (default: true when files exist).
 * File paths: {prefix}.schema (default: 'config/schema.sql')
 *             {prefix}.data   (default: 'config/data.sql')
 *
 * Disable by setting {prefix}.initialize = false in config.
 * Safe to use in tests — schema is applied each time the context starts
 * (in-memory DBs start fresh anyway).
 */
export class SchemaInitializer {
  constructor() {
    this.dataSource = null;      // autowired
    this._applicationContext = null;
    this._prefix = DEFAULT_PREFIX;
  }

  setApplicationContext(ctx) {
    this._applicationContext = ctx;
  }

  async init() {
    const config = this._applicationContext.config;
    const p = this._prefix;

    // initialize defaults to true; set to false to suppress
    if (config.has(`${p}.initialize`) && !config.get(`${p}.initialize`)) {
      return;
    }

    const schemaPath = config.has(`${p}.schema`)
      ? config.get(`${p}.schema`)
      : 'config/schema.sql';
    const dataPath = config.has(`${p}.data`)
      ? config.get(`${p}.data`)
      : 'config/data.sql';

    const conn = await this.dataSource.getConnection();
    try {
      await this._runFile(conn, schemaPath);
      await this._runFile(conn, dataPath);
    } finally {
      if (conn && typeof conn.close === 'function') {
        // don't close — SingleConnectionDataSource manages its own lifecycle
      }
    }
  }

  async _runFile(conn, filePath) {
    if (!existsSync(filePath)) return;
    const sql = readFileSync(filePath, 'utf8');
    // Split on ; separating statements, skip blanks and comment-only lines
    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));
    for (const stmt of statements) {
      const st = await conn.createStatement();
      await st.execute(stmt);
    }
  }
}

/**
 * DataSourceBuilder — fluent builder for named/secondary datasources.
 *
 * Spring's DataSourceBuilder pattern: one primary datasource is auto-configured;
 * additional datasources are explicitly declared with their own config prefix
 * and CDI bean name. This allows multiple adjacent (non-primary) datasources
 * within the same application context.
 *
 * Usage (secondary datasource):
 *
 *   // config:
 *   //   boot.datasource.reporting.url: jsdbc:pg:...
 *   //   boot.datasource.reporting.pool.enabled: true
 *
 *   import { DataSourceBuilder } from '@alt-javascript/boot-jsdbc';
 *   const reportingComponents = DataSourceBuilder
 *     .create()
 *     .prefix('boot.datasource.reporting')
 *     .beanNames({ dataSource: 'reportingDataSource', jsdbcTemplate: 'reportingJsdbcTemplate' })
 *     .build();
 *
 *   await jsdbcTemplateStarter({
 *     config,
 *     contexts: [new Context([...reportingComponents, new Singleton(ReportRepository)])],
 *   });
 *
 *   // ReportRepository.reportingJsdbcTemplate is now auto-wired.
 */
export class DataSourceBuilder {
  constructor() {
    this._prefix = DEFAULT_PREFIX;
    this._beanNames = {};
    this._includeSchemaInitializer = true;
  }

  static create() {
    return new DataSourceBuilder();
  }

  /**
   * Config prefix for this datasource's properties.
   * @param {string} prefix — e.g. 'boot.datasource.reporting'
   */
  prefix(prefix) {
    this._prefix = prefix;
    return this;
  }

  /**
   * Override CDI bean names. Keys: dataSource, jsdbcTemplate,
   * namedParameterJsdbcTemplate, schemaInitializer.
   * @param {object} names — partial override map
   */
  beanNames(names) {
    this._beanNames = { ...this._beanNames, ...names };
    return this;
  }

  /**
   * Disable SchemaInitializer registration for this datasource.
   */
  withoutSchemaInitializer() {
    this._includeSchemaInitializer = false;
    return this;
  }

  /**
   * Build CDI component definition array for this datasource.
   * @returns {Array} CDI component definitions
   */
  build() {
    const prefix = this._prefix;
    const names = this._beanNames;

    const dsName = names.dataSource ?? 'dataSource';
    const jtName = names.jsdbcTemplate ?? 'jsdbcTemplate';
    const njtName = names.namedParameterJsdbcTemplate ?? 'namedParameterJsdbcTemplate';
    const siName = names.schemaInitializer ?? 'schemaInitializer';

    // Build a DataSource class with the correct prefix baked in
    class BoundDataSource extends ConfiguredDataSource {
      constructor() {
        super();
        this._prefix = prefix;
      }
    }
    Object.defineProperty(BoundDataSource, 'name', { value: dsName });

    const components = [
      {
        name: dsName,
        Reference: BoundDataSource,
        scope: 'singleton',
        condition: (config, components) => {
          if (components[dsName]) return false;
          return config.has(`${prefix}.url`);
        },
      },
      {
        name: jtName,
        Reference: JsdbcTemplate,
        scope: 'singleton',
        constructorArgs: [dsName],
        dependsOn: dsName,
        condition: conditionalOnProperty(`${prefix}.url`),
      },
      {
        name: njtName,
        Reference: NamedParameterJsdbcTemplate,
        scope: 'singleton',
        constructorArgs: [dsName],
        dependsOn: dsName,
        condition: conditionalOnProperty(`${prefix}.url`),
      },
    ];

    if (this._includeSchemaInitializer) {
      class BoundSchemaInitializer extends SchemaInitializer {
        constructor() {
          super();
          this._prefix = prefix;
        }
      }
      Object.defineProperty(BoundSchemaInitializer, 'name', { value: siName });

      // Wire dataSource to the named bean for this builder's datasource
      const siRef = {
        name: siName,
        Reference: BoundSchemaInitializer,
        scope: 'singleton',
        properties: [{ name: 'dataSource', reference: dsName }],
        dependsOn: dsName,
        condition: conditionalOnProperty(`${prefix}.url`),
      };
      components.push(siRef);
    }

    return components;
  }
}

/**
 * Returns CDI component definitions for the primary datasource.
 *
 * Equivalent to DataSourceBuilder.create().prefix(prefix).build().
 *
 * @param {object} [options]
 * @param {string} [options.prefix='boot.datasource'] — config key prefix
 * @returns {Array} CDI component definitions
 */
export function jsdbcAutoConfiguration(options = {}) {
  const prefix = options.prefix ?? DEFAULT_PREFIX;
  return DataSourceBuilder.create().prefix(prefix).build();
}
