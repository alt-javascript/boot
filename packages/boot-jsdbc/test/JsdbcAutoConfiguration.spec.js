/**
 * JsdbcAutoConfiguration tests — moved from jsdbc-template (breaking change).
 *
 * Auto-configuration belongs in boot-jsdbc, not in the template library.
 * These tests verify ConfiguredDataSource, jsdbcAutoConfiguration(), and
 * the full CDI wiring behaviour.
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
} from '../index.js';

describe('JsdbcAutoConfiguration (boot-jsdbc)', () => {

  it('registers dataSource, jsdbcTemplate, and namedParameterJsdbcTemplate', async () => {
    const config = new EphemeralConfig({ jsdbc: { url: 'jsdbc:sqljs:memory' } });
    const context = new Context(jsdbcAutoConfiguration());
    const appCtx = new ApplicationContext({ contexts: [context], config });
    await appCtx.start({ run: false });

    assert.instanceOf(appCtx.get('dataSource'), ConfiguredDataSource);
    assert.instanceOf(appCtx.get('jsdbcTemplate'), JsdbcTemplate);
    assert.instanceOf(appCtx.get('namedParameterJsdbcTemplate'), NamedParameterJsdbcTemplate);
  });

  it('auto-configured JsdbcTemplate executes SQL', async () => {
    const config = new EphemeralConfig({ jsdbc: { url: 'jsdbc:sqljs:memory' } });
    const context = new Context(jsdbcAutoConfiguration());
    const appCtx = new ApplicationContext({ contexts: [context], config });
    await appCtx.start({ run: false });

    const template = appCtx.get('jsdbcTemplate');
    await template.execute('CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT)');
    await template.update('INSERT INTO items (id, name) VALUES (?, ?)', [1, 'Widget']);
    await template.update('INSERT INTO items (id, name) VALUES (?, ?)', [2, 'Gadget']);

    const items = await template.queryForList('SELECT * FROM items ORDER BY id');
    assert.equal(items.length, 2);
    assert.equal(items[0].name, 'Widget');
    assert.equal(items[1].name, 'Gadget');
  });

  it('skips registration when jsdbc.url is not configured', async () => {
    const config = new EphemeralConfig({ some: { key: 'value' } });
    const context = new Context(jsdbcAutoConfiguration());
    const appCtx = new ApplicationContext({ contexts: [context], config });
    await appCtx.start({ run: false });

    assert.isNull(appCtx.get('dataSource', null));
    assert.isNull(appCtx.get('jsdbcTemplate', null));
    assert.isNull(appCtx.get('namedParameterJsdbcTemplate', null));
  });

  it('does not replace an existing dataSource bean', async () => {
    const config = new EphemeralConfig({ jsdbc: { url: 'jsdbc:sqljs:memory' } });
    const customDs = { custom: true, getConnection: async () => {} };
    const context = new Context([
      { Reference: customDs, name: 'dataSource', scope: 'singleton' },
      ...jsdbcAutoConfiguration(),
    ]);
    const appCtx = new ApplicationContext({ contexts: [context], config });
    await appCtx.start({ run: false });

    const ds = appCtx.get('dataSource');
    assert.equal(ds.custom, true, 'should keep the user-provided dataSource');
  });

  it('ConfiguredDataSource uses SingleConnectionDataSource for in-memory URLs', async () => {
    const config = new EphemeralConfig({ jsdbc: { url: 'jsdbc:sqljs:memory' } });
    const context = new Context(jsdbcAutoConfiguration());
    const appCtx = new ApplicationContext({ contexts: [context], config });
    await appCtx.start({ run: false });

    const ds = appCtx.get('dataSource');
    assert.instanceOf(ds, ConfiguredDataSource);

    // In-memory: same connection every time
    const conn1 = await ds.getConnection();
    const conn2 = await ds.getConnection();
    assert.strictEqual(conn1, conn2);
  });

});
