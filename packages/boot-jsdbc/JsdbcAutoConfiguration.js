/**
 * JsdbcAutoConfiguration — CDI auto-configuration for JSDBC.
 *
 * Moved here from @alt-javascript/jsdbc-template (breaking change, bug fix):
 * auto-configuration is boot infrastructure and belongs in boot-jsdbc, not
 * in the template library that developers use standalone.
 *
 * Registers DataSource, JsdbcTemplate, and NamedParameterJsdbcTemplate
 * as CDI beans when `jsdbc.url` is present in config.
 *
 * Config keys:
 *   jsdbc.url                       — JSDBC connection URL (required)
 *   jsdbc.username                  — database username (optional)
 *   jsdbc.password                  — database password (optional)
 *   jsdbc.pool.enabled              — enable connection pooling (default: false)
 *   jsdbc.pool.min                  — min pool size (default: 0)
 *   jsdbc.pool.max                  — max pool size (default: 10)
 *   jsdbc.pool.acquireTimeoutMillis — acquire timeout ms (default: 30000)
 *   jsdbc.pool.idleTimeoutMillis    — idle timeout ms (default: 30000)
 */
import { conditionalOnProperty } from '@alt-javascript/cdi';
import { DataSource, PooledDataSource, SingleConnectionDataSource } from '@alt-javascript/jsdbc-core';
import { JsdbcTemplate, NamedParameterJsdbcTemplate } from '@alt-javascript/jsdbc-template';

/**
 * CDI-managed DataSource that reads jsdbc.* config via the ApplicationContext aware interface.
 * Delegates all DataSource operations to an inner DataSource or PooledDataSource
 * created during init().
 */
export class ConfiguredDataSource {
  constructor() {
    this._delegate = null;
    this._applicationContext = null;
  }

  setApplicationContext(ctx) {
    this._applicationContext = ctx;
  }

  init() {
    const config = this._applicationContext.config;
    const url = config.get('jsdbc.url');
    const props = { url };

    if (config.has('jsdbc.username')) props.username = config.get('jsdbc.username');
    if (config.has('jsdbc.password')) props.password = config.get('jsdbc.password');

    const poolEnabled = config.has('jsdbc.pool.enabled')
      && config.get('jsdbc.pool.enabled');

    if (poolEnabled) {
      const pool = {};
      if (config.has('jsdbc.pool.min')) pool.min = config.get('jsdbc.pool.min');
      if (config.has('jsdbc.pool.max')) pool.max = config.get('jsdbc.pool.max');
      if (config.has('jsdbc.pool.acquireTimeoutMillis')) {
        pool.acquireTimeoutMillis = config.get('jsdbc.pool.acquireTimeoutMillis');
      }
      if (config.has('jsdbc.pool.idleTimeoutMillis')) {
        pool.idleTimeoutMillis = config.get('jsdbc.pool.idleTimeoutMillis');
      }
      props.pool = pool;
      this._delegate = new PooledDataSource(props);
    } else if (this._isInMemoryUrl(url)) {
      this._delegate = new SingleConnectionDataSource(props);
    } else {
      this._delegate = new DataSource(props);
    }
  }

  /** @returns {Promise<Connection>} */
  async getConnection() {
    return this._delegate.getConnection();
  }

  /** @returns {string} */
  getUrl() {
    return this._delegate.getUrl?.() || this._delegate._url;
  }

  /** Destroy the underlying data source (closes pool if pooled). */
  async destroy() {
    if (this._delegate && typeof this._delegate.destroy === 'function') {
      await this._delegate.destroy();
    }
  }

  /**
   * @param {string} url
   * @returns {boolean}
   */
  _isInMemoryUrl(url) {
    return url.includes(':memory') || url.includes('::memory:');
  }
}

/**
 * Returns CDI component definitions that auto-configure JSDBC beans.
 *
 * Components registered (all conditional on jsdbc.url being present):
 *   dataSource                  — ConfiguredDataSource (reads jsdbc.* from config)
 *   jsdbcTemplate               — JsdbcTemplate wrapping dataSource
 *   namedParameterJsdbcTemplate — NamedParameterJsdbcTemplate wrapping dataSource
 *
 * An existing `dataSource` bean is never replaced.
 *
 * @returns {Array} CDI component definitions
 */
export function jsdbcAutoConfiguration() {
  return [
    {
      name: 'dataSource',
      Reference: ConfiguredDataSource,
      scope: 'singleton',
      condition: (config, components) => {
        if (components.dataSource) return false;
        return config.has('jsdbc.url');
      },
    },
    {
      name: 'jsdbcTemplate',
      Reference: JsdbcTemplate,
      scope: 'singleton',
      constructorArgs: ['dataSource'],
      dependsOn: 'dataSource',
      condition: conditionalOnProperty('jsdbc.url'),
    },
    {
      name: 'namedParameterJsdbcTemplate',
      Reference: NamedParameterJsdbcTemplate,
      scope: 'singleton',
      constructorArgs: ['dataSource'],
      dependsOn: 'dataSource',
      condition: conditionalOnProperty('jsdbc.url'),
    },
  ];
}
