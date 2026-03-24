/**
 * JsnosqlcAutoConfiguration — CDI auto-configuration for jsnosqlc NoSQL access.
 *
 * Config prefix defaults to 'boot.nosql' (analogous to boot.datasource).
 * Custom prefix supported for secondary client datasources.
 *
 * Config keys (substitute your prefix):
 *   {prefix}.url       — jsnosqlc URL (required)  e.g. jsnosqlc:memory:
 *   {prefix}.username  — optional credential
 *   {prefix}.password  — optional credential
 *
 * Registered CDI beans (default names):
 *   nosqlClient        — Client instance (call client.getCollection(name) directly)
 *
 * No template layer — Collection is the high-level API.
 * No schema initializer — NoSQL is schema-free by design.
 *
 * Multi-datasource usage:
 *
 *   const tagsComponents = NoSqlClientBuilder.create()
 *     .prefix('boot.nosql-tags')
 *     .beanNames({ client: 'tagsClient' })
 *     .build();
 */
import { conditionalOnProperty } from '@alt-javascript/cdi';
import { ClientDataSource } from '@alt-javascript/jsnosqlc-core';

export const DEFAULT_NOSQL_PREFIX = 'boot.nosql';

/**
 * ConfiguredClientDataSource — CDI-managed factory for a jsnosqlc Client.
 *
 * Reads connection URL (and optional credentials) from config.
 * Holds a single Client instance (lazy-initialised on first getClient() call).
 * Uses a promise-mutex to prevent concurrent-init races — multiple CDI beans
 * calling getClient() simultaneously during start will all receive the same
 * Client instance.
 */
export class ConfiguredClientDataSource {
  constructor() {
    this._delegate = null;
    this._applicationContext = null;
    this._prefix = DEFAULT_NOSQL_PREFIX;
    this._client = null;          // cached Client instance
    this._clientPromise = null;   // promise-mutex (same pattern as ConfiguredDataSource)
  }

  setApplicationContext(ctx) {
    this._applicationContext = ctx;
  }

  init() {
    const config = this._applicationContext.config;
    const p = this._prefix;
    const url = config.get(`${p}.url`);

    const props = {};
    if (config.has(`${p}.username`)) props.username = config.get(`${p}.username`);
    if (config.has(`${p}.password`)) props.password = config.get(`${p}.password`);

    this._delegate = new ClientDataSource({ url, ...props });
  }

  /**
   * Get the Client for this datasource.
   * Promise-mutex ensures only one Client is ever created even under concurrent callers.
   * @returns {Promise<import('@alt-javascript/jsnosqlc-core').Client>}
   */
  async getClient() {
    if (!this._clientPromise) {
      this._clientPromise = this._delegate.getClient().then((client) => {
        this._client = client;
        return client;
      });
    }
    return this._clientPromise;
  }

  /** @returns {string} */
  getUrl() {
    return this._delegate?.getUrl?.() ?? null;
  }

  async destroy() {
    if (this._client && !this._client.isClosed()) {
      await this._client.close();
      this._client = null;
    }
    this._clientPromise = null;
  }
}

/**
 * ManagedNosqlClient — CDI singleton that holds the live Client instance.
 *
 * Calls clientDataSource.getClient() during init() and exposes ready() so
 * dependent beans can await full connection establishment.
 * CDI does not await async init() — callers should use ready() after start.
 */
export class ManagedNosqlClient {
  constructor() {
    this.clientDataSource = null; // autowired
    this._client = null;
    this._readyPromise = null;
  }

  init() {
    this._readyPromise = this._connect();
    return this._readyPromise;
  }

  async _connect() {
    this._client = await this.clientDataSource.getClient();
  }

  /**
   * Await full client connection.
   * @returns {Promise<void>}
   */
  async ready() {
    if (this._readyPromise) await this._readyPromise;
  }

  /**
   * Get a Collection by name.
   * @param {string} name
   * @returns {import('@alt-javascript/jsnosqlc-core').Collection}
   */
  getCollection(name) {
    if (!this._client) throw new Error('NoSQL client not ready — await client.ready() first');
    return this._client.getCollection(name);
  }

  /**
   * The underlying Client instance (after ready()).
   * @returns {import('@alt-javascript/jsnosqlc-core').Client|null}
   */
  getClient() {
    return this._client;
  }
}

/**
 * NoSqlClientBuilder — fluent builder for named/secondary NoSQL client datasources.
 *
 * Mirrors DataSourceBuilder from boot-jsdbc.
 *
 * Usage (secondary client):
 *
 *   const sessionComponents = NoSqlClientBuilder.create()
 *     .prefix('boot.nosql-sessions')
 *     .beanNames({ clientDataSource: 'sessionClientDataSource', client: 'sessionClient' })
 *     .build();
 *
 *   await jsnosqlcStarter({
 *     config,
 *     contexts: [new Context([...sessionComponents, new Singleton(SessionRepository)])],
 *   });
 */
export class NoSqlClientBuilder {
  constructor() {
    this._prefix = DEFAULT_NOSQL_PREFIX;
    this._beanNames = {};
  }

  static create() {
    return new NoSqlClientBuilder();
  }

  /**
   * Config prefix for this client's properties.
   * @param {string} prefix — e.g. 'boot.nosql-sessions'
   */
  prefix(prefix) {
    this._prefix = prefix;
    return this;
  }

  /**
   * Override CDI bean names. Keys: clientDataSource, client.
   * @param {object} names
   */
  beanNames(names) {
    this._beanNames = { ...this._beanNames, ...names };
    return this;
  }

  /**
   * Build CDI component definition array for this NoSQL client.
   * @returns {Array} CDI component definitions
   */
  build() {
    const prefix = this._prefix;
    const names = this._beanNames;

    const dsName     = names.clientDataSource ?? 'nosqlClientDataSource';
    const clientName = names.client           ?? 'nosqlClient';

    class BoundClientDataSource extends ConfiguredClientDataSource {
      constructor() {
        super();
        this._prefix = prefix;
      }
    }
    Object.defineProperty(BoundClientDataSource, 'name', { value: dsName });

    class BoundManagedClient extends ManagedNosqlClient {
      constructor() {
        super();
      }
    }
    Object.defineProperty(BoundManagedClient, 'name', { value: clientName });

    return [
      {
        name: dsName,
        Reference: BoundClientDataSource,
        scope: 'singleton',
        condition: (config, components) => {
          if (components[dsName]) return false;
          return config.has(`${prefix}.url`);
        },
      },
      {
        name: clientName,
        Reference: BoundManagedClient,
        scope: 'singleton',
        properties: [{ name: 'clientDataSource', reference: dsName }],
        dependsOn: dsName,
        condition: conditionalOnProperty(`${prefix}.url`),
      },
    ];
  }
}

/**
 * Returns CDI component definitions for the primary NoSQL client.
 *
 * Equivalent to NoSqlClientBuilder.create().prefix(prefix).build().
 *
 * @param {object} [options]
 * @param {string} [options.prefix='boot.nosql'] — config key prefix
 * @returns {Array} CDI component definitions
 */
export function jsnosqlcAutoConfiguration(options = {}) {
  const prefix = options.prefix ?? DEFAULT_NOSQL_PREFIX;
  return NoSqlClientBuilder.create().prefix(prefix).build();
}
