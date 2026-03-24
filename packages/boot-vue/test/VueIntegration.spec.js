import { assert } from 'chai';
import { EphemeralConfig } from '@alt-javascript/config';
import { ApplicationContext } from '@alt-javascript/cdi';
import { Context } from '@alt-javascript/cdi/context/index.js';
import { createCdiApp, cdiPlugin, getBean } from '../index.js';

// --- Test services ---
class TodoService {
  constructor() { this.items = []; }
  add(title) { this.items.push({ title, done: false }); }
  list() { return this.items; }
}

class GreetingService {
  greet(name) { return `Hello, ${name}!`; }
}

// --- Mock Vue app that simulates provide/inject ---
function mockCreateApp(component) {
  const provided = {};
  return {
    component,
    provide(key, value) { provided[key] = value; },
    mount() { return this; },
    _provided: provided,
  };
}

describe('Vue CDI Integration', () => {
  describe('createCdiApp', () => {
    it('boots CDI and provides singletons to Vue app', async () => {
      const config = new EphemeralConfig({});
      const context = new Context([
        { Reference: TodoService, name: 'todoService', scope: 'singleton' },
        { Reference: GreetingService, name: 'greetingService', scope: 'singleton' },
      ]);

      const { vueApp, applicationContext } = await createCdiApp({
        contexts: [context],
        config,
        rootComponent: { template: '<div/>' },
        createApp: mockCreateApp,
      });

      // CDI context booted
      assert.instanceOf(applicationContext, ApplicationContext);

      // Singletons provided to Vue
      assert.instanceOf(vueApp._provided.todoService, TodoService);
      assert.instanceOf(vueApp._provided.greetingService, GreetingService);

      // ApplicationContext provided
      assert.strictEqual(vueApp._provided.applicationContext, applicationContext);
      assert.strictEqual(vueApp._provided.ctx, applicationContext);
    });

    it('calls onReady with app and context', async () => {
      const config = new EphemeralConfig({});
      const context = new Context([
        { Reference: GreetingService, name: 'greetingService', scope: 'singleton' },
      ]);

      let readyCalled = false;
      await createCdiApp({
        contexts: [context],
        config,
        rootComponent: { template: '<div/>' },
        createApp: mockCreateApp,
        onReady: (app, ctx) => {
          readyCalled = true;
          assert.exists(app);
          assert.instanceOf(ctx, ApplicationContext);
        },
      });

      assert.isTrue(readyCalled);
    });

    it('throws when Vue createApp is not available', async () => {
      const config = new EphemeralConfig({});
      try {
        await createCdiApp({
          contexts: [new Context([])],
          config,
          rootComponent: { template: '<div/>' },
        });
        assert.fail('should have thrown');
      } catch (err) {
        assert.include(err.message, 'options.createApp is required');
      }
    });
  });

  describe('cdiPlugin', () => {
    it('installs CDI context into Vue app via plugin', async () => {
      const config = new EphemeralConfig({});
      const context = new Context([
        { Reference: TodoService, name: 'todoService', scope: 'singleton' },
      ]);

      const mockApp = { _provided: {}, provide(k, v) { this._provided[k] = v; } };
      // Simulate app.use(cdiPlugin, options)
      await cdiPlugin.install(mockApp, { contexts: [context], config });

      assert.instanceOf(mockApp._provided.todoService, TodoService);
      assert.exists(mockApp._provided.applicationContext);
    });
  });

  describe('getBean', () => {
    it('resolves a CDI bean by name', async () => {
      const config = new EphemeralConfig({});
      const context = new Context([
        { Reference: GreetingService, name: 'greetingService', scope: 'singleton' },
      ]);
      const appCtx = new ApplicationContext({ contexts: [context], config });
      await appCtx.start({ run: false });

      const svc = getBean(appCtx, 'greetingService');
      assert.instanceOf(svc, GreetingService);
      assert.equal(svc.greet('World'), 'Hello, World!');
    });
  });

  describe('CDI wiring within provided services', () => {
    it('autowired dependencies are available after boot', async () => {
      class Controller {
        constructor() { this.greetingService = null; }
        handle(name) { return this.greetingService.greet(name); }
      }

      const config = new EphemeralConfig({});
      const context = new Context([
        { Reference: GreetingService, name: 'greetingService', scope: 'singleton' },
        { Reference: Controller, name: 'controller', scope: 'singleton' },
      ]);

      const { vueApp } = await createCdiApp({
        contexts: [context],
        config,
        rootComponent: { template: '<div/>' },
        createApp: mockCreateApp,
      });

      const ctrl = vueApp._provided.controller;
      assert.equal(ctrl.handle('Vue'), 'Hello, Vue!');
    });
  });
});
