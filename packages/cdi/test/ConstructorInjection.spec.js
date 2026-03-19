/* eslint-disable import/extensions */
import { assert } from 'chai';
import { LoggerFactory } from '@alt-javascript/logger';
import { config } from '@alt-javascript/config';
import { ApplicationContext } from '../index.js';
import { Context, Singleton } from '../context/index.js';

const logger = LoggerFactory.getLogger('@alt-javascript/cdi/test/ConstructorInjection_spec');

class ConfigHolder {
  constructor() {
    this.value = 'config-value';
  }
}

class ServiceWithDeps {
  constructor(configHolder) {
    this.configHolder = configHolder;
    this.initialized = false;
  }
}

class AwareService {
  constructor() {
    this.ctx = null;
  }

  setApplicationContext(ctx) {
    this.ctx = ctx;
  }
}

class AwareWithInit {
  constructor() {
    this.ctx = null;
    this.initCalled = false;
  }

  setApplicationContext(ctx) {
    this.ctx = ctx;
  }

  init() {
    this.initCalled = true;
  }
}

before(async () => {
  logger.verbose('spec setup started');
});

describe('Constructor Injection Specification', () => {
  it('resolves constructor args from context', async () => {
    const context = new Context([
      new Singleton(ConfigHolder),
      {
        Reference: ServiceWithDeps,
        name: 'serviceWithDeps',
        constructorArgs: ['configHolder'],
      },
    ]);
    const appCtx = new ApplicationContext({ contexts: [context], config });
    await appCtx.start({ run: false });

    const svc = appCtx.get('serviceWithDeps');
    assert.exists(svc.configHolder);
    assert.equal(svc.configHolder.value, 'config-value');
  });

  it('passes non-string args as literal values', async () => {
    class ServiceWithLiteral {
      constructor(value) {
        this.value = value;
      }
    }

    const context = new Context([
      {
        Reference: ServiceWithLiteral,
        name: 'serviceWithLiteral',
        constructorArgs: [42],
      },
    ]);
    const appCtx = new ApplicationContext({ contexts: [context], config });
    await appCtx.start({ run: false });

    const svc = appCtx.get('serviceWithLiteral');
    assert.equal(svc.value, 42);
  });

  it('works with no constructor args (backward compatible)', async () => {
    const context = new Context([new Singleton(ConfigHolder)]);
    const appCtx = new ApplicationContext({ contexts: [context], config });
    await appCtx.start({ run: false });

    const holder = appCtx.get('configHolder');
    assert.equal(holder.value, 'config-value');
  });
});

describe('Aware Interfaces Specification', () => {
  it('setApplicationContext is called during initialization', async () => {
    const context = new Context([new Singleton(AwareService)]);
    const appCtx = new ApplicationContext({ contexts: [context], config });
    await appCtx.start({ run: false });

    const svc = appCtx.get('awareService');
    assert.strictEqual(svc.ctx, appCtx);
  });

  it('setApplicationContext is called before init()', async () => {
    const context = new Context([new Singleton(AwareWithInit)]);
    const appCtx = new ApplicationContext({ contexts: [context], config });
    await appCtx.start({ run: false });

    const svc = appCtx.get('awareWithInit');
    assert.strictEqual(svc.ctx, appCtx);
    assert.isTrue(svc.initCalled);
  });

  it('beans without setApplicationContext are unaffected', async () => {
    const context = new Context([new Singleton(ConfigHolder)]);
    const appCtx = new ApplicationContext({ contexts: [context], config });
    await appCtx.start({ run: false });

    const holder = appCtx.get('configHolder');
    assert.equal(holder.value, 'config-value');
  });
});
