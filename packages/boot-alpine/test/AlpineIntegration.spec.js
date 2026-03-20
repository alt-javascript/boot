import { assert } from 'chai';
import { EphemeralConfig } from '@alt-javascript/config';
import { ApplicationContext } from '@alt-javascript/cdi';
import { Context } from '@alt-javascript/cdi/context/index.js';
import { bootAlpine } from '../index.js';

class TodoService {
  constructor() { this.items = []; }
  add(title) { this.items.push({ title, done: false }); }
  list() { return this.items; }
}

class GreetingService {
  greet(name) { return `Hello, ${name}!`; }
}

// Mock Alpine
function mockAlpine() {
  const stores = {};
  return {
    store(name, value) {
      if (value !== undefined) stores[name] = value;
      return stores[name];
    },
    _stores: stores,
  };
}

describe('Alpine.js CDI Integration', () => {
  describe('bootAlpine', () => {
    it('boots CDI and builds a store with all singletons', async () => {
      const config = new EphemeralConfig({});
      const context = new Context([
        { Reference: TodoService, name: 'todoService', scope: 'singleton' },
        { Reference: GreetingService, name: 'greetingService', scope: 'singleton' },
      ]);

      const { applicationContext, store } = await bootAlpine({
        contexts: [context],
        config,
      });

      assert.instanceOf(applicationContext, ApplicationContext);
      assert.instanceOf(store.todoService, TodoService);
      assert.instanceOf(store.greetingService, GreetingService);
      assert.strictEqual(store.ctx, applicationContext);
    });

    it('registers store on Alpine when available', async () => {
      const config = new EphemeralConfig({});
      const context = new Context([
        { Reference: GreetingService, name: 'greetingService', scope: 'singleton' },
      ]);
      const alpine = mockAlpine();

      await bootAlpine({
        contexts: [context],
        config,
        Alpine: alpine,
      });

      assert.exists(alpine._stores.cdi);
      assert.instanceOf(alpine._stores.cdi.greetingService, GreetingService);
    });

    it('uses custom store name', async () => {
      const config = new EphemeralConfig({});
      const context = new Context([
        { Reference: GreetingService, name: 'greetingService', scope: 'singleton' },
      ]);
      const alpine = mockAlpine();

      await bootAlpine({
        contexts: [context],
        config,
        Alpine: alpine,
        storeName: 'services',
      });

      assert.exists(alpine._stores.services);
      assert.notExists(alpine._stores.cdi);
    });

    it('works without Alpine (headless mode)', async () => {
      const config = new EphemeralConfig({});
      const context = new Context([
        { Reference: GreetingService, name: 'greetingService', scope: 'singleton' },
      ]);

      const { store } = await bootAlpine({ contexts: [context], config });
      assert.equal(store.greetingService.greet('Alpine'), 'Hello, Alpine!');
    });

    it('CDI autowiring works within the store', async () => {
      class Controller {
        constructor() { this.greetingService = null; }
        handle(name) { return this.greetingService.greet(name); }
      }

      const config = new EphemeralConfig({});
      const context = new Context([
        { Reference: GreetingService, name: 'greetingService', scope: 'singleton' },
        { Reference: Controller, name: 'controller', scope: 'singleton' },
      ]);

      const { store } = await bootAlpine({ contexts: [context], config });
      assert.equal(store.controller.handle('Alpine'), 'Hello, Alpine!');
    });
  });
});
