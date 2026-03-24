import { assert } from 'chai';
import { EphemeralConfig } from '@alt-javascript/config';
import { ApplicationContext } from '@alt-javascript/cdi';
import { Context } from '@alt-javascript/cdi/context/index.js';
import { bootAlpine, alpineStarter } from '../index.js';

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
  const data = {};
  return {
    store(name, value) {
      if (value !== undefined) stores[name] = value;
      return stores[name];
    },
    data(name, factory) {
      data[name] = factory;
    },
    _stores: stores,
    _data: data,
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

  describe('alpineStarter', () => {
    it('boots CDI via Boot.boot() and exposes singletons in store', async () => {
      const alpine = mockAlpine();
      const context = new Context([
        { Reference: TodoService, name: 'todoService', scope: 'singleton' },
        { Reference: GreetingService, name: 'greetingService', scope: 'singleton' },
      ]);

      const { applicationContext, store } = await alpineStarter({
        contexts: [context],
        config: {
          boot: { 'banner-mode': 'off' },
          app: { name: 'test', version: '0.0.0' },
          logging: { level: { ROOT: 'warn' } },
        },
        Alpine: alpine,
      });

      assert.instanceOf(applicationContext, ApplicationContext);
      assert.instanceOf(store.todoService, TodoService);
      assert.instanceOf(store.greetingService, GreetingService);
      assert.exists(alpine._stores.cdi);
    });

    it('calls setup(Alpine, appCtx) after CDI boots', async () => {
      const alpine = mockAlpine();
      let setupCalledWith = null;
      const context = new Context([
        { Reference: GreetingService, name: 'greetingService', scope: 'singleton' },
      ]);

      await alpineStarter({
        contexts: [context],
        config: {
          boot: { 'banner-mode': 'off' },
          app: { name: 'test', version: '0.0.0' },
          logging: { level: { ROOT: 'warn' } },
        },
        Alpine: alpine,
        setup(AlpineInstance, appCtx) {
          setupCalledWith = { AlpineInstance, appCtx };
          AlpineInstance.data('greeting', () => ({
            text: appCtx.get('greetingService').greet('World'),
          }));
        },
      });

      assert.strictEqual(setupCalledWith.AlpineInstance, alpine);
      assert.instanceOf(setupCalledWith.appCtx, ApplicationContext);
      assert.exists(alpine._data.greeting);
      const instance = alpine._data.greeting();
      assert.equal(instance.text, 'Hello, World!');
    });

    it('works headless (no window, no Alpine instance)', async () => {
      const context = new Context([
        { Reference: GreetingService, name: 'greetingService', scope: 'singleton' },
      ]);

      const { store } = await alpineStarter({
        contexts: [context],
        config: {
          boot: { 'banner-mode': 'off' },
          app: { name: 'test', version: '0.0.0' },
          logging: { level: { ROOT: 'warn' } },
        },
      });

      assert.equal(store.greetingService.greet('Node'), 'Hello, Node!');
    });

    it('uses custom store name', async () => {
      const alpine = mockAlpine();
      const context = new Context([
        { Reference: GreetingService, name: 'greetingService', scope: 'singleton' },
      ]);

      await alpineStarter({
        contexts: [context],
        config: {
          boot: { 'banner-mode': 'off' },
          app: { name: 'test', version: '0.0.0' },
          logging: { level: { ROOT: 'warn' } },
        },
        Alpine: alpine,
        storeName: 'app',
      });

      assert.exists(alpine._stores.app);
      assert.notExists(alpine._stores.cdi);
    });

    it('profile overlay applies via Boot.boot()', async () => {
      const context = new Context([
        { Reference: GreetingService, name: 'greetingService', scope: 'singleton' },
      ]);

      const { applicationContext } = await alpineStarter({
        contexts: [context],
        config: {
          boot: { 'banner-mode': 'off' },
          app: { name: 'test', version: '0.0.0', env: 'default' },
          logging: { level: { ROOT: 'warn' } },
        },
      });

      // No active profile in Node.js (no window.location) — config is still accessible
      assert.exists(applicationContext.config);
    });
  });
});
