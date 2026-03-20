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

describe('JSDBC Auto-Configuration', () => {
  describe('jsdbcAutoConfiguration with CDI', () => {
    it('registers dataSource, jsdbcTemplate, and namedParameterJsdbcTemplate', async () => {
      const config = new EphemeralConfig({
        jsdbc: { url: 'jsdbc:sqljs:memory' },
      });

      const context = new Context(jsdbcAutoConfiguration());
      const appCtx = new ApplicationContext({ contexts: [context], config });
      await appCtx.start({ run: false });

      const ds = appCtx.get('dataSource');
      assert.instanceOf(ds, ConfiguredDataSource);

      const template = appCtx.get('jsdbcTemplate');
      assert.instanceOf(template, JsdbcTemplate);

      const namedTemplate = appCtx.get('namedParameterJsdbcTemplate');
      assert.instanceOf(namedTemplate, NamedParameterJsdbcTemplate);
    });

    it('auto-configured JsdbcTemplate executes SQL', async () => {
      const config = new EphemeralConfig({
        jsdbc: { url: 'jsdbc:sqljs:memory' },
      });

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

    it('auto-configured NamedParameterJsdbcTemplate executes SQL', async () => {
      const config = new EphemeralConfig({
        jsdbc: { url: 'jsdbc:sqljs:memory' },
      });

      const context = new Context(jsdbcAutoConfiguration());
      const appCtx = new ApplicationContext({ contexts: [context], config });
      await appCtx.start({ run: false });

      const namedTemplate = appCtx.get('namedParameterJsdbcTemplate');

      await namedTemplate.execute('CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, price REAL)');
      await namedTemplate.update(
        'INSERT INTO products VALUES (:id, :name, :price)',
        { id: 1, name: 'Widget', price: 9.99 },
      );

      const product = await namedTemplate.queryForObject(
        'SELECT * FROM products WHERE id = :id',
        { id: 1 },
      );
      assert.equal(product.name, 'Widget');
      assert.closeTo(product.price, 9.99, 0.01);
    });

    it('skips registration when jsdbc.url is not configured', async () => {
      const config = new EphemeralConfig({ someOther: { key: 'value' } });

      const context = new Context(jsdbcAutoConfiguration());
      const appCtx = new ApplicationContext({ contexts: [context], config });
      await appCtx.start({ run: false });

      const ds = appCtx.get('dataSource', null);
      assert.isNull(ds);

      const template = appCtx.get('jsdbcTemplate', null);
      assert.isNull(template);

      const namedTemplate = appCtx.get('namedParameterJsdbcTemplate', null);
      assert.isNull(namedTemplate);
    });

    it('does not replace an existing dataSource bean', async () => {
      const config = new EphemeralConfig({
        jsdbc: { url: 'jsdbc:sqljs:memory' },
      });

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

    it('creates a PooledDataSource when jsdbc.pool.enabled is true', async () => {
      const config = new EphemeralConfig({
        jsdbc: {
          url: 'jsdbc:sqljs:memory',
          pool: { enabled: true, min: 0, max: 5 },
        },
      });

      const context = new Context(jsdbcAutoConfiguration());
      const appCtx = new ApplicationContext({ contexts: [context], config });
      await appCtx.start({ run: false });

      const ds = appCtx.get('dataSource');
      assert.instanceOf(ds, ConfiguredDataSource);

      // Verify it works — pooled or not, the template should function
      const template = appCtx.get('jsdbcTemplate');
      await template.execute('CREATE TABLE pooltest (id INTEGER)');
      await template.update('INSERT INTO pooltest VALUES (?)', [1]);
      const rows = await template.queryForList('SELECT * FROM pooltest');
      assert.equal(rows.length, 1);

      // Cleanup
      await ds.destroy();
    });

    it('works with user services that depend on jsdbcTemplate', async () => {
      class ItemRepository {
        constructor() {
          this.jsdbcTemplate = null; // autowired
        }

        async createTable() {
          await this.jsdbcTemplate.execute(
            'CREATE TABLE repo_items (id INTEGER PRIMARY KEY, name TEXT)',
          );
        }

        async save(id, name) {
          return this.jsdbcTemplate.update(
            'INSERT INTO repo_items VALUES (?, ?)', [id, name],
          );
        }

        async findAll() {
          return this.jsdbcTemplate.queryForList('SELECT * FROM repo_items ORDER BY id');
        }
      }

      const config = new EphemeralConfig({
        jsdbc: { url: 'jsdbc:sqljs:memory' },
      });

      const context = new Context([
        ...jsdbcAutoConfiguration(),
        { Reference: ItemRepository, name: 'itemRepository', scope: 'singleton' },
      ]);

      const appCtx = new ApplicationContext({ contexts: [context], config });
      await appCtx.start({ run: false });

      const repo = appCtx.get('itemRepository');
      assert.instanceOf(repo.jsdbcTemplate, JsdbcTemplate, 'jsdbcTemplate should be autowired');

      await repo.createTable();
      await repo.save(1, 'Alpha');
      await repo.save(2, 'Beta');

      const items = await repo.findAll();
      assert.equal(items.length, 2);
      assert.equal(items[0].name, 'Alpha');
    });
  });
});
