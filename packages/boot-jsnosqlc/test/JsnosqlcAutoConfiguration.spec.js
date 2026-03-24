/**
 * boot-jsnosqlc — CDI auto-configuration tests.
 *
 * All tests use @alt-javascript/jsnosqlc-memory (in-memory driver).
 * No external database, no native dependencies — runs in CI without infrastructure.
 */
import { assert } from 'chai';
import '@alt-javascript/jsnosqlc-memory';
import { Context, Singleton } from '@alt-javascript/cdi';
import { EphemeralConfig } from '@alt-javascript/config';
import { ApplicationContext } from '@alt-javascript/cdi';
import {
  jsnosqlcAutoConfiguration,
  jsnosqlcStarter,
  ConfiguredClientDataSource,
  ManagedNosqlClient,
  NoSqlClientBuilder,
  DEFAULT_NOSQL_PREFIX,
} from '../index.js';

const IN_MEMORY_CONFIG = (extra = {}) => ({
  boot: { 'banner-mode': 'off', nosql: { url: 'jsnosqlc:memory:' }, ...extra },
  app: { name: 'boot-jsnosqlc-test' },
  logging: { level: { ROOT: 'error' } },
});

// ---------------------------------------------------------------------------
// Helper — wire context directly (no Boot.boot() overhead for unit tests)
// ---------------------------------------------------------------------------
async function startContext(configObj, extraContexts = []) {
  const config = new EphemeralConfig(configObj);
  const ctx = new Context(jsnosqlcAutoConfiguration());
  const appCtx = new ApplicationContext({
    contexts: [...extraContexts, ctx],
    config,
  });
  await appCtx.start({ run: false });
  return appCtx;
}

// ---------------------------------------------------------------------------

describe('boot-jsnosqlc', () => {

  describe('DEFAULT_NOSQL_PREFIX', () => {
    it('is boot.nosql', () => {
      assert.equal(DEFAULT_NOSQL_PREFIX, 'boot.nosql');
    });
  });

  describe('jsnosqlcStarter()', () => {
    it('returns a component definition array', () => {
      const components = jsnosqlcStarter();
      assert.isArray(components);
      assert.isAbove(components.length, 0);
      components.forEach((c) => {
        assert.isString(c.name);
        assert.exists(c.Reference);
      });
    });

    it('includes nosqlClientDataSource and nosqlClient components', () => {
      const names = jsnosqlcStarter().map((c) => c.name);
      assert.include(names, 'nosqlClientDataSource');
      assert.include(names, 'nosqlClient');
    });
  });

  describe('CDI integration — primary client', () => {

    it('registers ConfiguredClientDataSource and ManagedNosqlClient beans', async () => {
      const ctx = await startContext(IN_MEMORY_CONFIG());
      assert.instanceOf(ctx.get('nosqlClientDataSource'), ConfiguredClientDataSource);
      assert.instanceOf(ctx.get('nosqlClient'), ManagedNosqlClient);
    });

    it('nosqlClient.ready() resolves — client is connected', async () => {
      const ctx = await startContext(IN_MEMORY_CONFIG());
      const client = ctx.get('nosqlClient');
      await client.ready();
      assert.isNotNull(client.getClient());
    });

    it('getCollection() returns a Collection after ready()', async () => {
      const ctx = await startContext(IN_MEMORY_CONFIG());
      const client = ctx.get('nosqlClient');
      await client.ready();
      const col = client.getCollection('test');
      assert.isNotNull(col);
      assert.equal(col.getName(), 'test');
    });

    it('does not register beans when boot.nosql.url is absent', async () => {
      const ctx = await startContext({
        boot: { 'banner-mode': 'off' },
        app: { name: 'no-nosql-test' },
        logging: { level: { ROOT: 'error' } },
      });
      assert.isNull(ctx.get('nosqlClientDataSource', null));
      assert.isNull(ctx.get('nosqlClient', null));
    });

  });

  describe('Collection operations via CDI client', () => {

    let col;

    beforeEach(async () => {
      const ctx = await startContext(IN_MEMORY_CONFIG());
      const client = ctx.get('nosqlClient');
      await client.ready();
      col = client.getCollection('items');
    });

    it('store() + get() round-trips a document', async () => {
      await col.store('item-1', { name: 'Widget', price: 9.99 });
      const doc = await col.get('item-1');
      assert.equal(doc.name, 'Widget');
      assert.closeTo(doc.price, 9.99, 0.01);
    });

    it('get() returns null for missing key', async () => {
      assert.isNull(await col.get('missing-' + Date.now()));
    });

    it('insert() assigns an _id and returns it', async () => {
      const id = await col.insert({ name: 'Gadget' });
      assert.isString(id);
      const doc = await col.get(id);
      assert.equal(doc.name, 'Gadget');
      assert.equal(doc._id, id);
    });

    it('update() patches a document without losing other fields', async () => {
      await col.store('item-2', { name: 'Doohickey', price: 4.99, qty: 10 });
      await col.update('item-2', { price: 5.49 });
      const doc = await col.get('item-2');
      assert.equal(doc.name, 'Doohickey');  // preserved
      assert.closeTo(doc.price, 5.49, 0.01); // updated
      assert.equal(doc.qty, 10);             // preserved
    });

    it('delete() removes a document', async () => {
      await col.store('item-del', { name: 'Temp' });
      await col.delete('item-del');
      assert.isNull(await col.get('item-del'));
    });

    it('find() filters documents using Filter AST', async () => {
      const { Filter } = await import('@alt-javascript/jsnosqlc-core');
      await col.store('f1', { category: 'A', value: 10 });
      await col.store('f2', { category: 'B', value: 20 });
      await col.store('f3', { category: 'A', value: 30 });

      const filter = Filter.where('category').eq('A').build();
      const cursor = await col.find(filter);
      const docs = cursor.getDocuments();
      assert.equal(docs.length, 2);
      assert.isTrue(docs.every((d) => d.category === 'A'));
    });

    it('Cursor supports for-await-of iteration', async () => {
      const { Filter } = await import('@alt-javascript/jsnosqlc-core');
      await col.store('iter-1', { tag: 'x', n: 1 });
      await col.store('iter-2', { tag: 'x', n: 2 });
      await col.store('iter-3', { tag: 'y', n: 3 });

      const cursor = await col.find(Filter.where('tag').eq('x').build());
      const collected = [];
      for await (const doc of cursor) {
        collected.push(doc);
      }
      assert.equal(collected.length, 2);
    });

  });

  describe('NoSqlClientBuilder — secondary client', () => {

    it('builds components with custom prefix and bean names', async () => {
      const components = NoSqlClientBuilder.create()
        .prefix('boot.nosql-tags')
        .beanNames({ clientDataSource: 'tagsClientDataSource', client: 'tagsClient' })
        .build();

      const names = components.map((c) => c.name);
      assert.include(names, 'tagsClientDataSource');
      assert.include(names, 'tagsClient');
    });

    it('two clients coexist in one context', async () => {
      const tagsComponents = NoSqlClientBuilder.create()
        .prefix('boot.nosql-tags')
        .beanNames({ clientDataSource: 'tagsClientDataSource', client: 'tagsClient' })
        .build();

      const config = new EphemeralConfig({
        boot: {
          'banner-mode': 'off',
          nosql:      { url: 'jsnosqlc:memory:' },
          'nosql-tags': { url: 'jsnosqlc:memory:' },
        },
        app: { name: 'multi-nosql-test' },
        logging: { level: { ROOT: 'error' } },
      });

      const primaryCtx = new Context(jsnosqlcAutoConfiguration());
      const tagsCtx = new Context(tagsComponents);
      const appCtx = new ApplicationContext({ contexts: [primaryCtx, tagsCtx], config });
      await appCtx.start({ run: false });

      const primary = appCtx.get('nosqlClient');
      const tags = appCtx.get('tagsClient');

      await Promise.all([primary.ready(), tags.ready()]);

      assert.instanceOf(primary, ManagedNosqlClient);
      assert.instanceOf(tags, ManagedNosqlClient);

      // Verify they are independent stores
      await primary.getCollection('users').store('u1', { name: 'Alice' });
      assert.isNull(await tags.getCollection('users').get('u1'), 'secondary store should be independent');
    });

  });

});
