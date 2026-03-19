/* eslint-disable import/extensions */
import { assert } from 'chai';
import { LoggerFactory } from '@alt-javascript/logger';
import { config } from '@alt-javascript/config';
import { ApplicationContext } from '../index.js';
import { Context, Singleton } from '../context/index.js';

const logger = LoggerFactory.getLogger('@alt-javascript/cdi/test/Primary_spec');

before(async () => {
  logger.verbose('spec setup started');
});

describe('Primary Bean Specification', () => {
  it('primary replaces existing non-primary', async () => {
    class DefaultImpl {
      constructor() { this.type = 'default'; }
    }
    class PrimaryImpl {
      constructor() { this.type = 'primary'; }
    }

    const context = new Context([
      { Reference: DefaultImpl, name: 'myService' },
    ]);
    const context2 = new Context([
      { Reference: PrimaryImpl, name: 'myService', primary: true },
    ]);
    const appCtx = new ApplicationContext({ contexts: [context, context2], config });
    await appCtx.start({ run: false });

    const svc = appCtx.get('myService');
    assert.equal(svc.type, 'primary');
  });

  it('non-primary registered first, primary registered second wins', async () => {
    class A { constructor() { this.v = 'a'; } }
    class B { constructor() { this.v = 'b'; } }

    const context = new Context([
      { Reference: A, name: 'svc' },
      { Reference: B, name: 'svc', primary: true },
    ]);
    const appCtx = new ApplicationContext({ contexts: [context], config });
    await appCtx.start({ run: false });

    assert.equal(appCtx.get('svc').v, 'b');
  });

  it('primary registered first, non-primary registered second is skipped', async () => {
    class A { constructor() { this.v = 'a'; } }
    class B { constructor() { this.v = 'b'; } }

    const context = new Context([
      { Reference: A, name: 'svc', primary: true },
      { Reference: B, name: 'svc' },
    ]);
    const appCtx = new ApplicationContext({ contexts: [context], config });
    await appCtx.start({ run: false });

    assert.equal(appCtx.get('svc').v, 'a');
  });

  it('two primary beans with same name still throws', async () => {
    class A { constructor() {} }
    class B { constructor() {} }

    const context = new Context([
      { Reference: A, name: 'svc', primary: true },
      { Reference: B, name: 'svc', primary: true },
    ]);
    const appCtx = new ApplicationContext({ contexts: [context], config });

    try {
      await appCtx.start({ run: false });
      assert.fail('should have thrown');
    } catch (e) {
      assert.include(e.message, 'Duplicate definition');
    }
  });

  it('two non-primary beans with same name still throws', async () => {
    class A { constructor() {} }
    class B { constructor() {} }

    const context = new Context([
      { Reference: A, name: 'svc' },
      { Reference: B, name: 'svc' },
    ]);
    const appCtx = new ApplicationContext({ contexts: [context], config });

    try {
      await appCtx.start({ run: false });
      assert.fail('should have thrown');
    } catch (e) {
      assert.include(e.message, 'Duplicate definition');
    }
  });
});
