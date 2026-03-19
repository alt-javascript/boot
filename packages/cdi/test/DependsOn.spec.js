/* eslint-disable import/extensions */
import { assert } from 'chai';
import { LoggerFactory } from '@alt-javascript/logger';
import { config } from '@alt-javascript/config';
import { ApplicationContext } from '../index.js';
import { Context, Singleton } from '../context/index.js';

const logger = LoggerFactory.getLogger('@alt-javascript/cdi/test/DependsOn_spec');

before(async () => {
  logger.verbose('spec setup started');
});

describe('DependsOn Specification', () => {
  it('dependsOn controls initialization order', async () => {
    const initOrder = [];

    class First {
      init() { initOrder.push('first'); }
    }
    class Second {
      init() { initOrder.push('second'); }
    }

    const context = new Context([
      { Reference: Second, name: 'second', dependsOn: ['first'] },
      { Reference: First, name: 'first' },
    ]);
    const appCtx = new ApplicationContext({ contexts: [context], config });
    await appCtx.start({ run: false });

    assert.equal(initOrder[0], 'first', 'first should initialize before second');
    assert.equal(initOrder[1], 'second', 'second should initialize after first');
  });

  it('multiple dependsOn entries all respected', async () => {
    const initOrder = [];

    class A { init() { initOrder.push('a'); } }
    class B { init() { initOrder.push('b'); } }
    class C { init() { initOrder.push('c'); } }

    const context = new Context([
      { Reference: C, name: 'c', dependsOn: ['a', 'b'] },
      { Reference: A, name: 'a' },
      { Reference: B, name: 'b' },
    ]);
    const appCtx = new ApplicationContext({ contexts: [context], config });
    await appCtx.start({ run: false });

    const cIdx = initOrder.indexOf('c');
    const aIdx = initOrder.indexOf('a');
    const bIdx = initOrder.indexOf('b');
    assert.isTrue(aIdx < cIdx, 'a should be initialized before c');
    assert.isTrue(bIdx < cIdx, 'b should be initialized before c');
  });

  it('dependsOn chain (A → B → C)', async () => {
    const initOrder = [];

    class X { init() { initOrder.push('x'); } }
    class Y { init() { initOrder.push('y'); } }
    class Z { init() { initOrder.push('z'); } }

    const context = new Context([
      { Reference: Z, name: 'z', dependsOn: ['y'] },
      { Reference: Y, name: 'y', dependsOn: ['x'] },
      { Reference: X, name: 'x' },
    ]);
    const appCtx = new ApplicationContext({ contexts: [context], config });
    await appCtx.start({ run: false });

    assert.deepEqual(initOrder.slice(0, 3).filter((n) => ['x', 'y', 'z'].includes(n)), ['x', 'y', 'z']);
  });

  it('dependsOn referencing non-existent component throws', async () => {
    class Lonely { init() {} }

    const context = new Context([
      { Reference: Lonely, name: 'lonely', dependsOn: ['nonExistent'] },
    ]);
    const appCtx = new ApplicationContext({ contexts: [context], config });

    try {
      await appCtx.start({ run: false });
      assert.fail('should have thrown');
    } catch (e) {
      assert.include(e.message, 'nonExistent');
      assert.include(e.message, 'does not exist');
    }
  });

  it('circular dependsOn throws', async () => {
    class P { init() {} }
    class Q { init() {} }

    const context = new Context([
      { Reference: P, name: 'p', dependsOn: ['q'] },
      { Reference: Q, name: 'q', dependsOn: ['p'] },
    ]);
    const appCtx = new ApplicationContext({ contexts: [context], config });

    try {
      await appCtx.start({ run: false });
      assert.fail('should have thrown');
    } catch (e) {
      assert.include(e.message, 'Circular dependsOn');
    }
  });

  it('components without dependsOn initialize normally', async () => {
    class Simple {
      constructor() { this.val = 42; }
    }

    const context = new Context([new Singleton(Simple)]);
    const appCtx = new ApplicationContext({ contexts: [context], config });
    await appCtx.start({ run: false });

    const s = appCtx.get('simple');
    assert.equal(s.val, 42);
  });

  it('dependsOn as string (not array) works', async () => {
    const initOrder = [];

    class M1 { init() { initOrder.push('m1'); } }
    class M2 { init() { initOrder.push('m2'); } }

    const context = new Context([
      { Reference: M2, name: 'm2', dependsOn: 'm1' },
      { Reference: M1, name: 'm1' },
    ]);
    const appCtx = new ApplicationContext({ contexts: [context], config });
    await appCtx.start({ run: false });

    assert.equal(initOrder.indexOf('m1') < initOrder.indexOf('m2'), true);
  });
});
