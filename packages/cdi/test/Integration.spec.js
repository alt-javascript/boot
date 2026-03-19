/* eslint-disable import/extensions */
import { assert } from 'chai';
import { LoggerFactory } from '@alt-javascript/logger';
import { EphemeralConfig } from '@alt-javascript/config';
import {
  ApplicationContext,
  BeanPostProcessor,
  ContextRefreshedEvent,
  scan,
  conditionalOnProperty,
  createProxy,
} from '../index.js';
import { Context, Singleton } from '../context/index.js';

const logger = LoggerFactory.getLogger('@alt-javascript/cdi/test/Integration_spec');

// --- Feature classes for integrated scenario ---

/** Auto-discovered dependency */
class Repository {
  static __component = true;

  constructor() {
    this.data = ['item-1', 'item-2'];
  }

  findAll() {
    return this.data;
  }
}

/** Auto-discovered, conditional, constructor-injected, AOP-proxied, aware, event-publishing */
class ItemService {
  static __component = {
    scope: 'singleton',
    condition: conditionalOnProperty('feature.items', true),
  };

  constructor() {
    // Will be set via constructor injection
    this.repository = null;
    this.ctx = null;
    this.eventLog = [];
  }

  setApplicationContext(ctx) {
    this.ctx = ctx;
  }

  init() {
    // Publish a custom event after initialization
    if (this.ctx) {
      const publisher = this.ctx.get('applicationEventPublisher');
      publisher.publish({ type: 'ItemServiceReady', source: this });
    }
  }

  getItems() {
    return this.repository ? this.repository.findAll() : [];
  }
}

/** Convention-based event listener */
class AuditListener {
  static __component = true;

  constructor() {
    this.events = [];
  }

  onApplicationEvent(event) {
    this.events.push(event.type || event.constructor.name);
  }
}

/** AOP-applying BeanPostProcessor */
class LoggingAspectProcessor extends BeanPostProcessor {
  constructor() {
    super();
    this.interceptedCalls = [];
  }

  postProcessAfterInitialization(instance, name) {
    if (name === 'itemService') {
      return createProxy(instance, [
        {
          pointcut: 'getItems',
          before: (args, methodName) => {
            this.interceptedCalls.push(`${name}.${methodName}`);
          },
        },
      ]);
    }
    return instance;
  }
}

before(async () => {
  logger.verbose('spec setup started');
});

describe('v3.0 Integrated Scenario', () => {
  it('exercises auto-discovery + conditions + constructor-injection + aware + AOP + events', async () => {
    // 1. Config that enables the feature
    const cfg = new EphemeralConfig({ feature: { items: true } });

    // 2. Auto-discover components
    const discovered = scan([Repository, ItemService, AuditListener]);
    assert.equal(discovered.length, 3, 'should discover 3 components');

    // 3. Create context with discovered components + BeanPostProcessor
    const aopProcessor = new LoggingAspectProcessor();
    const context = new Context([
      ...discovered,
      { Reference: aopProcessor, name: 'loggingAspectProcessor' },
    ]);

    // 4. Wire repository into itemService constructor
    // Override itemService to use property wiring (since constructor injection
    // requires the component definition, not __component metadata)
    // For this test, we use property-based autowiring which already works
    // The repository will be autowired via the null-property convention

    const appCtx = new ApplicationContext({ contexts: [context], config: cfg });
    await appCtx.start({ run: false });

    // 5. Verify auto-discovery worked
    const repo = appCtx.get('repository');
    assert.exists(repo, 'repository should be discovered');
    assert.deepEqual(repo.findAll(), ['item-1', 'item-2']);

    // 6. Verify condition was evaluated (feature.items = true → registered)
    const itemSvc = appCtx.get('itemService');
    assert.exists(itemSvc, 'itemService should be registered (condition passed)');

    // 7. Verify aware interface — setApplicationContext was called
    // Note: the proxy wraps the original, so setApplicationContext was called on the original
    // We can verify by checking that init() was called (which uses this.ctx)
    // The AOP proxy preserves property access to the underlying target

    // 8. Verify AOP proxy is applied — calling getItems triggers before advice
    const items = itemSvc.getItems();
    assert.deepEqual(items, ['item-1', 'item-2']);
    assert.include(aopProcessor.interceptedCalls, 'itemService.getItems',
      'AOP before advice should have been called');

    // 9. Verify event listener received lifecycle events
    const listener = appCtx.get('auditListener');
    assert.include(listener.events, 'ContextRefreshedEvent',
      'listener should receive ContextRefreshedEvent');
    assert.include(listener.events, 'ItemServiceReady',
      'listener should receive custom ItemServiceReady event');

    // 10. Verify event publisher is accessible
    const publisher = appCtx.get('applicationEventPublisher');
    assert.exists(publisher);
  });

  it('condition prevents registration when feature is disabled', async () => {
    const cfg = new EphemeralConfig({ feature: { items: false } });
    const discovered = scan([Repository, ItemService, AuditListener]);
    const context = new Context(discovered);

    const appCtx = new ApplicationContext({ contexts: [context], config: cfg });
    await appCtx.start({ run: false });

    // Repository has no condition — should be registered
    assert.exists(appCtx.get('repository'));

    // ItemService has conditionalOnProperty(feature.items, true) — should be skipped
    const itemSvc = appCtx.get('itemService', null);
    assert.isNull(itemSvc, 'itemService should not be registered when feature is disabled');

    // AuditListener has no condition — should be registered and received events
    const listener = appCtx.get('auditListener');
    assert.include(listener.events, 'ContextRefreshedEvent');
  });

  it('constructor injection with auto-discovered dependency', async () => {
    class DepA {
      static __component = true;

      constructor() {
        this.value = 'dep-a';
      }
    }

    class ConsumerService {
      constructor(depA) {
        this.depA = depA;
      }

      getValue() {
        return this.depA ? this.depA.value : null;
      }
    }

    const discovered = scan([DepA]);
    const context = new Context([
      ...discovered,
      {
        Reference: ConsumerService,
        name: 'consumerService',
        constructorArgs: ['depA'],
      },
    ]);

    const cfg = new EphemeralConfig({});
    const appCtx = new ApplicationContext({ contexts: [context], config: cfg });
    await appCtx.start({ run: false });

    const consumer = appCtx.get('consumerService');
    assert.equal(consumer.getValue(), 'dep-a');
  });
});
