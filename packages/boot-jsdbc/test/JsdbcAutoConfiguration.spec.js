/**
 * JsdbcAutoConfiguration tests — moved from jsdbc-template (breaking change).
 *
 * Config prefix is now 'boot.datasource.*' (was 'jsdbc.*').
 */
import { assert } from 'chai';
import { EphemeralConfig } from '@alt-javascript/config';
import { ApplicationContext } from '@alt-javascript/cdi';
import { Context } from '@alt-javascript/cdi/context/index.js';
import '@alt-javascript/jsdbc-sqljs';

import {
  JsdbcTemplate,
  NamedParameterJsdbcTemplate,
  jsdbcAutoConfiguration,
  ConfiguredDataSource,
  DataSourceBuilder,
  SchemaInitializer,
  DEFAULT_PREFIX,
} from '../index.js';

// ── helpers ────────────────────────────────────────────────────────────────

const IN_MEMORY = { boot: { datasource: { url: 'jsdbc:sqljs:memory' } } };

async function startCtx(configData, ...extraComponents) {
  const config = new EphemeralConfig(configData);
  const context = new Context([...jsdbcAutoConfiguration(), ...extraComponents]);
  const appCtx = new ApplicationContext({ contexts: [context], config });
  await appCtx.start({ run: false });
  return appCtx;
}

// ── primary datasource ─────────────────────────────────────────────────────

describe('JsdbcAutoConfiguration (boot-jsdbc)', () => {

  it('DEFAULT_PREFIX is boot.datasource', () => {
    assert.equal(DEFAULT_PREFIX, 'boot.datasource');
  });

  it('registers dataSource, jsdbcTemplate, namedParameterJsdbcTemplate, schemaInitializer', async () => {
    const appCtx = await startCtx(IN_MEMORY);
    assert.instanceOf(appCtx.get('dataSource'), ConfiguredDataSource);
    assert.instanceOf(appCtx.get('jsdbcTemplate'), JsdbcTemplate);
    assert.instanceOf(appCtx.get('namedParameterJsdbcTemplate'), NamedParameterJsdbcTemplate);
    assert.instanceOf(appCtx.get('schemaInitializer'), SchemaInitializer);
  });

  it('auto-configured JsdbcTemplate executes SQL', async () => {
    const appCtx = await startCtx(IN_MEMORY);
    const template = appCtx.get('jsdbcTemplate');
    await template.execute('CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT)');
    await template.update('INSERT INTO items (id, name) VALUES (?, ?)', [1, 'Widget']);
    await template.update('INSERT INTO items (id, name) VALUES (?, ?)', [2, 'Gadget']);
    const items = await template.queryForList('SELECT * FROM items ORDER BY id');
    assert.equal(items.length, 2);
    assert.equal(items[0].name, 'Widget');
  });

  it('skips registration when boot.datasource.url is not configured', async () => {
    const appCtx = await startCtx({ some: { key: 'value' } });
    assert.isNull(appCtx.get('dataSource', null));
    assert.isNull(appCtx.get('jsdbcTemplate', null));
    assert.isNull(appCtx.get('namedParameterJsdbcTemplate', null));
    assert.isNull(appCtx.get('schemaInitializer', null));
  });

  it('does not replace an existing dataSource bean', async () => {
    const customDs = { custom: true, getConnection: async () => {} };
    const config = new EphemeralConfig(IN_MEMORY);
    const context = new Context([
      { Reference: customDs, name: 'dataSource', scope: 'singleton' },
      ...jsdbcAutoConfiguration(),
    ]);
    const appCtx = new ApplicationContext({ contexts: [context], config });
    await appCtx.start({ run: false });
    assert.equal(appCtx.get('dataSource').custom, true);
  });

  it('ConfiguredDataSource uses SingleConnectionDataSource for in-memory URLs', async () => {
    const appCtx = await startCtx(IN_MEMORY);
    const ds = appCtx.get('dataSource');
    const conn1 = await ds.getConnection();
    const conn2 = await ds.getConnection();
    assert.strictEqual(conn1, conn2);
  });

  it('accepts a custom prefix via jsdbcAutoConfiguration({ prefix })', async () => {
    const config = new EphemeralConfig({ myapp: { db: { url: 'jsdbc:sqljs:memory' } } });
    const context = new Context(jsdbcAutoConfiguration({ prefix: 'myapp.db' }));
    const appCtx = new ApplicationContext({ contexts: [context], config });
    await appCtx.start({ run: false });
    assert.instanceOf(appCtx.get('jsdbcTemplate'), JsdbcTemplate);
  });

  it('SchemaInitializer skips when boot.datasource.initialize = false', async () => {
    const config = new EphemeralConfig({
      boot: { datasource: { url: 'jsdbc:sqljs:memory', initialize: false } },
    });
    const context = new Context(jsdbcAutoConfiguration());
    const appCtx = new ApplicationContext({ contexts: [context], config });
    // Should start without error even though no schema files exist
    await appCtx.start({ run: false });
    assert.instanceOf(appCtx.get('dataSource'), ConfiguredDataSource);
  });

  it('SchemaInitializer silently skips missing sql files', async () => {
    const config = new EphemeralConfig({
      boot: { datasource: { url: 'jsdbc:sqljs:memory' } },
    });
    const context = new Context(jsdbcAutoConfiguration());
    const appCtx = new ApplicationContext({ contexts: [context], config });
    // config/schema.sql and config/data.sql don't exist in this package — should be fine
    await appCtx.start({ run: false });
    assert.instanceOf(appCtx.get('jsdbcTemplate'), JsdbcTemplate);
  });

});

// ── DataSourceBuilder ──────────────────────────────────────────────────────

describe('DataSourceBuilder', () => {

  it('build() produces default bean names', () => {
    const components = DataSourceBuilder.create().build();
    const names = components.map((c) => c.name);
    assert.include(names, 'dataSource');
    assert.include(names, 'jsdbcTemplate');
    assert.include(names, 'namedParameterJsdbcTemplate');
    assert.include(names, 'schemaInitializer');
  });

  it('beanNames() overrides individual bean names', () => {
    const components = DataSourceBuilder.create()
      .prefix('boot.datasource.reporting')
      .beanNames({ dataSource: 'reportingDs', jsdbcTemplate: 'reportingTemplate' })
      .build();
    const names = components.map((c) => c.name);
    assert.include(names, 'reportingDs');
    assert.include(names, 'reportingTemplate');
    assert.include(names, 'namedParameterJsdbcTemplate');
  });

  it('withoutSchemaInitializer() excludes the SchemaInitializer component', () => {
    const components = DataSourceBuilder.create()
      .withoutSchemaInitializer()
      .build();
    const names = components.map((c) => c.name);
    assert.notInclude(names, 'schemaInitializer');
  });

  it('wires a secondary datasource at a custom prefix', async () => {
    const config = new EphemeralConfig({
      boot: {
        datasource: { url: 'jsdbc:sqljs:memory' },
        reporting: { url: 'jsdbc:sqljs:memory' },
      },
    });
    const primaryComponents = jsdbcAutoConfiguration();
    const secondaryComponents = DataSourceBuilder.create()
      .prefix('boot.reporting')
      .beanNames({
        dataSource: 'reportingDataSource',
        jsdbcTemplate: 'reportingJsdbcTemplate',
        namedParameterJsdbcTemplate: 'reportingNamedJsdbcTemplate',
        schemaInitializer: 'reportingSchemaInitializer',
      })
      .build();

    const context = new Context([...primaryComponents, ...secondaryComponents]);
    const appCtx = new ApplicationContext({ contexts: [context], config });
    await appCtx.start({ run: false });

    assert.instanceOf(appCtx.get('dataSource'), ConfiguredDataSource);
    assert.instanceOf(appCtx.get('jsdbcTemplate'), JsdbcTemplate);
    assert.instanceOf(appCtx.get('reportingDataSource'), ConfiguredDataSource);
    assert.instanceOf(appCtx.get('reportingJsdbcTemplate'), JsdbcTemplate);
    // They are different datasource instances
    assert.notStrictEqual(
      appCtx.get('dataSource'),
      appCtx.get('reportingDataSource'),
    );
  });

});
