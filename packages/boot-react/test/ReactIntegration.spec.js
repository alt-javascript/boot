import { assert } from 'chai';
import { EphemeralConfig } from '@alt-javascript/config';
import { ApplicationContext } from '@alt-javascript/cdi';
import { Context } from '@alt-javascript/cdi/context/index.js';
import { bootCdi, bootCdiHeadless } from '../index.js';

class TodoService {
  constructor() { this.items = []; }
  add(title) { this.items.push({ title, done: false }); }
  list() { return this.items; }
}

class GreetingService {
  greet(name) { return `Hello, ${name}!`; }
}

class Controller {
  constructor() { this.greetingService = null; }
  handle(name) { return this.greetingService.greet(name); }
}

describe('React CDI Integration', () => {
  describe('bootCdi (headless — no React available)', () => {
    it('boots CDI and returns getBean utility', async () => {
      const config = new EphemeralConfig({});
      const context = new Context([
        { Reference: GreetingService, name: 'greetingService', scope: 'singleton' },
        { Reference: TodoService, name: 'todoService', scope: 'singleton' },
      ]);

      const result = await bootCdi({ contexts: [context], config });

      assert.instanceOf(result.applicationContext, ApplicationContext);
      assert.isNull(result.CdiProvider);
      assert.isNull(result.useCdi);
      assert.isNull(result.useBean);
      assert.isFunction(result.getBean);
    });

    it('getBean resolves CDI singletons', async () => {
      const config = new EphemeralConfig({});
      const context = new Context([
        { Reference: GreetingService, name: 'greetingService', scope: 'singleton' },
      ]);

      const { getBean } = await bootCdi({ contexts: [context], config });
      const svc = getBean('greetingService');
      assert.instanceOf(svc, GreetingService);
      assert.equal(svc.greet('React'), 'Hello, React!');
    });
  });

  describe('bootCdi (with mock React)', () => {
    it('creates CdiProvider, useCdi, useBean when React is available', async () => {
      // Minimal mock React with createContext / useContext / createElement
      let contextValue = null;
      const mockReact = {
        createContext(defaultValue) {
          return { Provider: 'MockProvider', _defaultValue: defaultValue };
        },
        useContext(ctx) {
          return contextValue;
        },
        createElement(type, props, ...children) {
          // Simulate Provider: store value for useContext
          if (props?.value) contextValue = props.value;
          return { type, props, children };
        },
      };

      const config = new EphemeralConfig({});
      const context = new Context([
        { Reference: GreetingService, name: 'greetingService', scope: 'singleton' },
      ]);

      const result = await bootCdi({
        contexts: [context],
        config,
        React: mockReact,
      });

      assert.isFunction(result.CdiProvider);
      assert.isFunction(result.useCdi);
      assert.isFunction(result.useBean);
      assert.isFunction(result.getBean);
    });

    it('CdiProvider creates a React element with context value', async () => {
      let contextValue = null;
      const mockReact = {
        createContext() { return { Provider: 'MockProvider' }; },
        useContext() { return contextValue; },
        createElement(type, props, ...children) {
          if (props?.value) contextValue = props.value;
          return { type, props, children };
        },
      };

      const config = new EphemeralConfig({});
      const context = new Context([
        { Reference: GreetingService, name: 'greetingService', scope: 'singleton' },
      ]);

      const { CdiProvider, applicationContext } = await bootCdi({
        contexts: [context],
        config,
        React: mockReact,
      });

      // Simulate rendering <CdiProvider>
      CdiProvider({ children: 'child' });
      assert.strictEqual(contextValue, applicationContext);
    });

    it('useBean resolves a bean after Provider renders', async () => {
      let contextValue = null;
      const mockReact = {
        createContext() { return { _ctx: true }; },
        useContext() { return contextValue; },
        createElement(type, props, ...children) {
          if (props?.value) contextValue = props.value;
          return { type, props, children };
        },
      };

      const config = new EphemeralConfig({});
      const context = new Context([
        { Reference: GreetingService, name: 'greetingService', scope: 'singleton' },
      ]);

      const { CdiProvider, useBean } = await bootCdi({
        contexts: [context],
        config,
        React: mockReact,
      });

      // Simulate render
      CdiProvider({ children: null });

      // Simulate calling useBean inside a component
      const svc = useBean('greetingService');
      assert.instanceOf(svc, GreetingService);
      assert.equal(svc.greet('Hook'), 'Hello, Hook!');
    });
  });

  describe('bootCdiHeadless', () => {
    it('returns a booted ApplicationContext', async () => {
      const config = new EphemeralConfig({});
      const context = new Context([
        { Reference: TodoService, name: 'todoService', scope: 'singleton' },
        { Reference: Controller, name: 'controller', scope: 'singleton' },
        { Reference: GreetingService, name: 'greetingService', scope: 'singleton' },
      ]);

      const ctx = await bootCdiHeadless({ contexts: [context], config });

      assert.instanceOf(ctx, ApplicationContext);
      const ctrl = ctx.get('controller');
      assert.equal(ctrl.handle('Headless'), 'Hello, Headless!');
    });
  });

  describe('CDI autowiring through React integration', () => {
    it('autowired dependencies work via getBean', async () => {
      const config = new EphemeralConfig({});
      const context = new Context([
        { Reference: GreetingService, name: 'greetingService', scope: 'singleton' },
        { Reference: Controller, name: 'controller', scope: 'singleton' },
      ]);

      const { getBean } = await bootCdi({ contexts: [context], config });
      const ctrl = getBean('controller');
      assert.equal(ctrl.handle('DI'), 'Hello, DI!');
    });
  });
});
