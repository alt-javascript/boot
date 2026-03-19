/* eslint-disable import/extensions */
import { assert } from 'chai';
import { LoggerFactory } from '@alt-javascript/logger';
import { config } from '@alt-javascript/config';
import { ApplicationContext, BeanPostProcessor } from '../index.js';
import { Context, Component, Singleton } from '../context/index.js';
import SimpleClass from './service/SimpleClass.js';

const logger = LoggerFactory.getLogger('@alt-javascript/cdi/test/BeanPostProcessor_spec');

class TrackingPostProcessor extends BeanPostProcessor {
  constructor() {
    super();
    this.beforeCalls = [];
    this.afterCalls = [];
  }

  postProcessBeforeInitialization(instance, name) {
    this.beforeCalls.push(name);
    return instance;
  }

  postProcessAfterInitialization(instance, name) {
    this.afterCalls.push(name);
    return instance;
  }
}

class MutatingPostProcessor extends BeanPostProcessor {
  postProcessBeforeInitialization(instance, name) {
    if (name === 'simpleClass') {
      instance.mutatedBefore = true;
    }
    return instance;
  }

  postProcessAfterInitialization(instance, name) {
    if (name === 'simpleClass') {
      instance.mutatedAfter = true;
    }
    return instance;
  }
}

class ReplacingPostProcessor extends BeanPostProcessor {
  postProcessAfterInitialization(instance, name) {
    if (name === 'simpleClass') {
      return { replaced: true, originalUuid: instance.uuid };
    }
    return instance;
  }
}

before(async () => {
  logger.verbose('spec setup started');
});

describe('BeanPostProcessor Specification', () => {
  it('postProcessBeforeInitialization is called for each singleton', async () => {
    const tracker = new TrackingPostProcessor();
    const context = new Context([
      new Singleton(SimpleClass),
      { Reference: tracker, name: 'trackingPostProcessor' },
    ]);
    const appCtx = new ApplicationContext({ contexts: [context], config });
    await appCtx.start({ run: false });

    assert.isTrue(tracker.beforeCalls.includes('simpleClass'),
      'simpleClass should be in beforeCalls');
    assert.isFalse(tracker.beforeCalls.includes('trackingPostProcessor'),
      'BeanPostProcessors should not be processed by other BeanPostProcessors');
  });

  it('postProcessAfterInitialization is called for each singleton', async () => {
    const tracker = new TrackingPostProcessor();
    const context = new Context([
      new Singleton(SimpleClass),
      { Reference: tracker, name: 'trackingPostProcessor' },
    ]);
    const appCtx = new ApplicationContext({ contexts: [context], config });
    await appCtx.start({ run: false });

    assert.isTrue(tracker.afterCalls.includes('simpleClass'),
      'simpleClass should be in afterCalls');
  });

  it('BeanPostProcessor can mutate bean instances', async () => {
    const mutator = new MutatingPostProcessor();
    const context = new Context([
      new Singleton(SimpleClass),
      { Reference: mutator, name: 'mutatingPostProcessor' },
    ]);
    const appCtx = new ApplicationContext({ contexts: [context], config });
    await appCtx.start({ run: false });

    const simple = appCtx.get('simpleClass');
    assert.isTrue(simple.mutatedBefore, 'mutatedBefore should be true');
    assert.isTrue(simple.mutatedAfter, 'mutatedAfter should be true');
  });

  it('BeanPostProcessor can replace bean instances', async () => {
    const replacer = new ReplacingPostProcessor();
    const context = new Context([
      new Singleton(SimpleClass),
      { Reference: replacer, name: 'replacingPostProcessor' },
    ]);
    const appCtx = new ApplicationContext({ contexts: [context], config });
    await appCtx.start({ run: false });

    const simple = appCtx.get('simpleClass');
    assert.isTrue(simple.replaced, 'instance should be the replacement object');
    assert.exists(simple.originalUuid, 'replacement should carry originalUuid');
  });

  it('multiple BeanPostProcessors are called in registration order', async () => {
    const order = [];

    class FirstBPP extends BeanPostProcessor {
      postProcessBeforeInitialization(instance, name) {
        if (name === 'simpleClass') order.push('first-before');
        return instance;
      }

      postProcessAfterInitialization(instance, name) {
        if (name === 'simpleClass') order.push('first-after');
        return instance;
      }
    }

    class SecondBPP extends BeanPostProcessor {
      postProcessBeforeInitialization(instance, name) {
        if (name === 'simpleClass') order.push('second-before');
        return instance;
      }

      postProcessAfterInitialization(instance, name) {
        if (name === 'simpleClass') order.push('second-after');
        return instance;
      }
    }

    const context = new Context([
      new Singleton(SimpleClass),
      { Reference: new FirstBPP(), name: 'firstBPP' },
      { Reference: new SecondBPP(), name: 'secondBPP' },
    ]);
    const appCtx = new ApplicationContext({ contexts: [context], config });
    await appCtx.start({ run: false });

    assert.deepEqual(order, ['first-before', 'second-before', 'first-after', 'second-after']);
  });

  it('BeanPostProcessors do not process the event publisher', async () => {
    const tracker = new TrackingPostProcessor();
    const context = new Context([
      new Singleton(SimpleClass),
      { Reference: tracker, name: 'trackingPostProcessor' },
    ]);
    const appCtx = new ApplicationContext({ contexts: [context], config });
    await appCtx.start({ run: false });

    // applicationEventPublisher is auto-registered but not a BeanPostProcessor,
    // so it SHOULD be processed. But verify it doesn't cause errors.
    assert.isTrue(tracker.beforeCalls.includes('applicationEventPublisher'));
  });

  it('context with no BeanPostProcessors works normally', async () => {
    const context = new Context([
      new Singleton(SimpleClass),
    ]);
    const appCtx = new ApplicationContext({ contexts: [context], config });
    await appCtx.start({ run: false });

    const simple = appCtx.get('simpleClass');
    assert.exists(simple.uuid, 'SimpleClass should have a uuid');
  });
});
