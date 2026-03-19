/* eslint-disable import/extensions */
import { assert } from 'chai';
import { LoggerFactory } from '@alt-javascript/logger';
import { config } from '@alt-javascript/config';
import { ApplicationContext } from '../index.js';
import { Context, Singleton } from '../context/index.js';

const logger = LoggerFactory.getLogger('@alt-javascript/cdi/test/CircularDeps_spec');

before(async () => {
  logger.verbose('spec setup started');
});

describe('Circular Dependency Detection', () => {
  it('detects direct circular constructor dependency (A → B → A)', async () => {
    class ClassA {
      constructor(classB) { this.classB = classB; }
    }
    class ClassB {
      constructor(classA) { this.classA = classA; }
    }

    const context = new Context([
      { Reference: ClassA, name: 'classA', constructorArgs: ['classB'] },
      { Reference: ClassB, name: 'classB', constructorArgs: ['classA'] },
    ]);
    const appCtx = new ApplicationContext({ contexts: [context], config });

    try {
      await appCtx.start({ run: false });
      assert.fail('should have thrown');
    } catch (e) {
      assert.include(e.message, 'Circular dependency detected');
      assert.include(e.message, 'classA');
      assert.include(e.message, 'classB');
    }
  });

  it('detects indirect circular constructor dependency (A → B → C → A)', async () => {
    class A { constructor(b) { this.b = b; } }
    class B { constructor(c) { this.c = c; } }
    class C { constructor(a) { this.a = a; } }

    const context = new Context([
      { Reference: A, name: 'a', constructorArgs: ['b'] },
      { Reference: B, name: 'b', constructorArgs: ['c'] },
      { Reference: C, name: 'c', constructorArgs: ['a'] },
    ]);
    const appCtx = new ApplicationContext({ contexts: [context], config });

    try {
      await appCtx.start({ run: false });
      assert.fail('should have thrown');
    } catch (e) {
      assert.include(e.message, 'Circular dependency detected');
    }
  });

  it('non-circular constructor chain resolves successfully', async () => {
    class Dep { constructor() { this.value = 'dep'; } }
    class Svc { constructor(dep) { this.dep = dep; } }

    const context = new Context([
      { Reference: Dep, name: 'dep' },
      { Reference: Svc, name: 'svc', constructorArgs: ['dep'] },
    ]);
    const appCtx = new ApplicationContext({ contexts: [context], config });
    await appCtx.start({ run: false });

    const svc = appCtx.get('svc');
    assert.exists(svc.dep);
    assert.equal(svc.dep.value, 'dep');
  });

  it('property-based circular references work (like Spring)', async () => {
    // Property injection handles circular refs via early reference exposure
    class PA { constructor() { this.pB = null; } }
    class PB { constructor() { this.pA = null; } }

    const context = new Context([
      new Singleton(PA),
      new Singleton(PB),
    ]);
    const appCtx = new ApplicationContext({ contexts: [context], config });
    await appCtx.start({ run: false });

    const a = appCtx.get('pA');
    const b = appCtx.get('pB');
    // Both should exist and reference each other via autowiring
    assert.exists(a);
    assert.exists(b);
    assert.strictEqual(a.pB, b);
    assert.strictEqual(b.pA, a);
  });
});
