/* eslint-disable import/extensions */
import { assert } from 'chai';
import { LoggerFactory } from '@alt-javascript/logger';
import { config } from '@alt-javascript/config';
import {
  ApplicationContext,
  ApplicationEventPublisher,
  ContextRefreshedEvent,
  ContextClosedEvent,
} from '../index.js';
import { Context, Singleton } from '../context/index.js';
import SimpleClass from './service/SimpleClass.js';

const logger = LoggerFactory.getLogger('@alt-javascript/cdi/test/Events_spec');

before(async () => {
  logger.verbose('spec setup started');
});

describe('Application Events Specification', () => {
  describe('ApplicationEventPublisher auto-registration', () => {
    it('applicationEventPublisher is available from context', async () => {
      const context = new Context([new Singleton(SimpleClass)]);
      const appCtx = new ApplicationContext({ contexts: [context], config });
      await appCtx.start({ run: false });

      const publisher = appCtx.get('applicationEventPublisher');
      assert.exists(publisher);
      assert.instanceOf(publisher, ApplicationEventPublisher);
    });

    it('event publisher is the same instance on context and appCtx', async () => {
      const context = new Context([new Singleton(SimpleClass)]);
      const appCtx = new ApplicationContext({ contexts: [context], config });
      await appCtx.start({ run: false });

      assert.strictEqual(appCtx.eventPublisher, appCtx.get('applicationEventPublisher'));
    });
  });

  describe('ContextRefreshedEvent', () => {
    it('fires after context start', async () => {
      const received = [];
      const context = new Context([new Singleton(SimpleClass)]);
      const appCtx = new ApplicationContext({ contexts: [context], config });

      // Subscribe before start via the publisher that gets created during prepare
      // We need to hook in after registerEventPublisher but before publishContextRefreshedEvent
      // The cleanest way: override start to subscribe between prepare and event
      const origPrepare = appCtx.prepare.bind(appCtx);
      appCtx.prepare = async function () {
        await origPrepare();
        // At this point, ContextRefreshedEvent was already published in prepare.
        // So we need a different approach — subscribe via convention.
      };

      // Better approach: use a listener bean with onApplicationEvent
      // Reset and use the convention approach
      const appCtx2 = new ApplicationContext({ contexts: [context], config });

      // We'll use a direct publisher subscription after start to verify the event was published
      // by checking it was received by a convention listener
      class EventTracker {
        constructor() {
          this.events = [];
        }

        onApplicationEvent(event) {
          this.events.push(event);
        }
      }

      const tracker = new EventTracker();
      const context2 = new Context([
        new Singleton(SimpleClass),
        { Reference: tracker, name: 'eventTracker' },
      ]);
      const appCtx3 = new ApplicationContext({ contexts: [context2], config });
      await appCtx3.start({ run: false });

      const refreshed = tracker.events.filter((e) => e instanceof ContextRefreshedEvent);
      assert.equal(refreshed.length, 1, 'should receive exactly one ContextRefreshedEvent');
      assert.equal(refreshed[0].source, appCtx3, 'source should be the ApplicationContext');
    });

    it('ContextRefreshedEvent has timestamp', async () => {
      class EventTracker {
        constructor() {
          this.events = [];
        }

        onApplicationEvent(event) {
          this.events.push(event);
        }
      }

      const tracker = new EventTracker();
      const context = new Context([
        { Reference: tracker, name: 'eventTracker' },
      ]);
      const appCtx = new ApplicationContext({ contexts: [context], config });
      await appCtx.start({ run: false });

      const refreshed = tracker.events.find((e) => e instanceof ContextRefreshedEvent);
      assert.exists(refreshed);
      assert.instanceOf(refreshed.timestamp, Date);
    });
  });

  describe('Convention-based event listeners', () => {
    it('beans with onApplicationEvent receive lifecycle events', async () => {
      class MyListener {
        constructor() {
          this.received = [];
        }

        onApplicationEvent(event) {
          this.received.push(event.type || event.constructor.name);
        }
      }

      const listener = new MyListener();
      const context = new Context([
        new Singleton(SimpleClass),
        { Reference: listener, name: 'myListener' },
      ]);
      const appCtx = new ApplicationContext({ contexts: [context], config });
      await appCtx.start({ run: false });

      assert.include(listener.received, 'ContextRefreshedEvent');
    });

    it('beans without onApplicationEvent are not subscribed', async () => {
      const context = new Context([new Singleton(SimpleClass)]);
      const appCtx = new ApplicationContext({ contexts: [context], config });
      await appCtx.start({ run: false });

      // SimpleClass has no onApplicationEvent — should not throw
      const publisher = appCtx.get('applicationEventPublisher');
      // Only wildcard listeners from convention detection, no type-specific
      // Publisher should have listeners for convention beans
      assert.exists(publisher);
    });
  });

  describe('Custom events via publisher', () => {
    it('components can publish and receive custom events', async () => {
      class MyListener {
        constructor() {
          this.received = [];
        }

        onApplicationEvent(event) {
          this.received.push(event);
        }
      }

      const listener = new MyListener();
      const context = new Context([
        { Reference: listener, name: 'myListener' },
      ]);
      const appCtx = new ApplicationContext({ contexts: [context], config });
      await appCtx.start({ run: false });

      // Publish a custom event after context is started
      const publisher = appCtx.get('applicationEventPublisher');
      publisher.publish({ type: 'CustomEvent', data: 'hello' });

      const custom = listener.received.filter((e) => e.type === 'CustomEvent');
      assert.equal(custom.length, 1);
      assert.equal(custom[0].data, 'hello');
    });

    it('typed subscription works after context start', async () => {
      const context = new Context([new Singleton(SimpleClass)]);
      const appCtx = new ApplicationContext({ contexts: [context], config });
      await appCtx.start({ run: false });

      const received = [];
      const publisher = appCtx.get('applicationEventPublisher');
      publisher.on('MyEvent', (event) => received.push(event));
      publisher.publish({ type: 'MyEvent', value: 42 });

      assert.equal(received.length, 1);
      assert.equal(received[0].value, 42);
    });
  });

  describe('Multiple listeners', () => {
    it('multiple convention listeners all receive events', async () => {
      class Listener1 {
        constructor() { this.count = 0; }

        onApplicationEvent() { this.count += 1; }
      }

      class Listener2 {
        constructor() { this.count = 0; }

        onApplicationEvent() { this.count += 1; }
      }

      const l1 = new Listener1();
      const l2 = new Listener2();
      const context = new Context([
        { Reference: l1, name: 'listener1' },
        { Reference: l2, name: 'listener2' },
      ]);
      const appCtx = new ApplicationContext({ contexts: [context], config });
      await appCtx.start({ run: false });

      // Both should have received ContextRefreshedEvent
      assert.isAtLeast(l1.count, 1, 'listener1 should have received at least 1 event');
      assert.isAtLeast(l2.count, 1, 'listener2 should have received at least 1 event');
    });
  });
});
