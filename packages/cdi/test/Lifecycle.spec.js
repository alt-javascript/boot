/* eslint-disable import/extensions */
import { assert } from 'chai';
import { LoggerFactory } from '@alt-javascript/logger';
import { config } from '@alt-javascript/config';
import { ApplicationContext } from '../index.js';
import { Context, Singleton } from '../context/index.js';

const logger = LoggerFactory.getLogger('@alt-javascript/cdi/test/Lifecycle_spec');

before(async () => {
  logger.verbose('spec setup started');
});

describe('Lifecycle Interface Specification', () => {
  it('start() is called during run phase', async () => {
    class MyServer {
      constructor() { this.started = false; }

      start() { this.started = true; }
    }

    const context = new Context([new Singleton(MyServer)]);
    const appCtx = new ApplicationContext({ contexts: [context], config });
    await appCtx.start(); // run: true (default)

    const server = appCtx.get('myServer');
    assert.isTrue(server.started);
  });

  it('start() is not called when run: false', async () => {
    class MyServer {
      constructor() { this.started = false; }

      start() { this.started = true; }
    }

    const context = new Context([new Singleton(MyServer)]);
    const appCtx = new ApplicationContext({ contexts: [context], config });
    await appCtx.start({ run: false });

    const server = appCtx.get('myServer');
    assert.isFalse(server.started);
  });

  it('beans without start() are unaffected', async () => {
    class Plain {
      constructor() { this.val = 42; }
    }

    const context = new Context([new Singleton(Plain)]);
    const appCtx = new ApplicationContext({ contexts: [context], config });
    await appCtx.start();

    assert.equal(appCtx.get('plain').val, 42);
  });

  it('init() and start() are both called in correct order', async () => {
    const calls = [];

    class Ordered {
      init() { calls.push('init'); }

      start() { calls.push('start'); }
    }

    const context = new Context([new Singleton(Ordered)]);
    const appCtx = new ApplicationContext({ contexts: [context], config });
    await appCtx.start();

    assert.equal(calls[0], 'init', 'init called during prepare');
    assert.equal(calls[1], 'start', 'start called during run');
  });
});
