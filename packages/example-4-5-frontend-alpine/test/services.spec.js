/**
 * test/services.spec.js — unit tests for TodoService CDI bean.
 *
 * Tests run in Node.js (mocha) — no browser required.
 * CDI wiring is verified via ApplicationContext directly (no Alpine).
 */
import { assert } from 'chai';
import { EphemeralConfig } from '@alt-javascript/config';
import { ApplicationContext } from '@alt-javascript/cdi';
import { Context } from '@alt-javascript/cdi/context/index.js';
import { TodoService } from '../src/services.js';

function makeCtx() {
  const config = new EphemeralConfig({
    app: { name: 'test', version: '0.0.0' },
    logging: { level: { ROOT: 'warn' } },
  });
  const context = new Context([
    { Reference: TodoService, name: 'todoService', scope: 'singleton' },
  ]);
  return new ApplicationContext({ contexts: [context], config });
}

describe('TodoService', () => {
  it('seeds two items on init', async () => {
    const ctx = makeCtx();
    await ctx.start({ run: false });
    const svc = ctx.get('todoService');
    const items = svc.getAll();
    assert.equal(items.length, 2);
    assert.ok(items[0].title.includes('Learn'));
    assert.ok(items[1].title.includes('Alpine'));
  });

  it('adds a new item', async () => {
    const ctx = makeCtx();
    await ctx.start({ run: false });
    const svc = ctx.get('todoService');
    svc.add('Test item');
    assert.equal(svc.getAll().length, 3);
    assert.equal(svc.getAll()[2].title, 'Test item');
  });

  it('toggles done state', async () => {
    const ctx = makeCtx();
    await ctx.start({ run: false });
    const svc = ctx.get('todoService');
    const id = svc.getAll()[0].id;
    assert.isFalse(svc.getAll()[0].done);
    svc.toggle(id);
    assert.isTrue(svc.getAll()[0].done);
    svc.toggle(id);
    assert.isFalse(svc.getAll()[0].done);
  });

  it('removes an item', async () => {
    const ctx = makeCtx();
    await ctx.start({ run: false });
    const svc = ctx.get('todoService');
    const id = svc.getAll()[0].id;
    svc.remove(id);
    assert.equal(svc.getAll().length, 1);
    assert.notEqual(svc.getAll()[0].id, id);
  });

  it('getAll returns a copy (mutation-safe)', async () => {
    const ctx = makeCtx();
    await ctx.start({ run: false });
    const svc = ctx.get('todoService');
    const copy = svc.getAll();
    copy.push({ id: 99, title: 'injected', done: false });
    assert.equal(svc.getAll().length, 2, 'internal array should be unaffected');
  });
});
