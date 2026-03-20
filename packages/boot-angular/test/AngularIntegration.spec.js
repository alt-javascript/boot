import { assert } from 'chai';
import { EphemeralConfig } from '@alt-javascript/config';
import { ApplicationContext } from '@alt-javascript/cdi';
import { Context } from '@alt-javascript/cdi/context/index.js';
import { createCdiProviders, createCdiProvidersWithService, CdiService } from '../index.js';

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

describe('Angular CDI Integration', () => {
  describe('createCdiProviders', () => {
    it('boots CDI and returns Angular provider definitions', async () => {
      const config = new EphemeralConfig({});
      const context = new Context([
        { Reference: GreetingService, name: 'greetingService', scope: 'singleton' },
        { Reference: TodoService, name: 'todoService', scope: 'singleton' },
      ]);

      const { applicationContext, providers } = await createCdiProviders({
        contexts: [context],
        config,
      });

      assert.instanceOf(applicationContext, ApplicationContext);
      assert.isArray(providers);

      // Should include applicationContext + each singleton
      const providerNames = providers.map((p) => p.provide);
      assert.include(providerNames, 'applicationContext');
      assert.include(providerNames, 'greetingService');
      assert.include(providerNames, 'todoService');
    });

    it('provider useValue contains the CDI bean instance', async () => {
      const config = new EphemeralConfig({});
      const context = new Context([
        { Reference: GreetingService, name: 'greetingService', scope: 'singleton' },
      ]);

      const { providers } = await createCdiProviders({
        contexts: [context],
        config,
      });

      const greetingProvider = providers.find((p) => p.provide === 'greetingService');
      assert.instanceOf(greetingProvider.useValue, GreetingService);
      assert.equal(greetingProvider.useValue.greet('Angular'), 'Hello, Angular!');
    });

    it('CDI autowiring works within provided beans', async () => {
      const config = new EphemeralConfig({});
      const context = new Context([
        { Reference: GreetingService, name: 'greetingService', scope: 'singleton' },
        { Reference: Controller, name: 'controller', scope: 'singleton' },
      ]);

      const { providers } = await createCdiProviders({
        contexts: [context],
        config,
      });

      const ctrlProvider = providers.find((p) => p.provide === 'controller');
      assert.equal(ctrlProvider.useValue.handle('DI'), 'Hello, DI!');
    });
  });

  describe('createCdiProvidersWithService', () => {
    it('includes a CdiService provider for dynamic bean lookup', async () => {
      const config = new EphemeralConfig({});
      const context = new Context([
        { Reference: GreetingService, name: 'greetingService', scope: 'singleton' },
      ]);

      const { providers } = await createCdiProvidersWithService({
        contexts: [context],
        config,
      });

      const cdiProvider = providers.find((p) => p.provide === 'cdiService');
      assert.exists(cdiProvider);
      assert.instanceOf(cdiProvider.useValue, CdiService);

      const svc = cdiProvider.useValue.getBean('greetingService');
      assert.equal(svc.greet('Service'), 'Hello, Service!');
    });

    it('CdiService exposes applicationContext', async () => {
      const config = new EphemeralConfig({});
      const context = new Context([]);

      const { providers } = await createCdiProvidersWithService({
        contexts: [context],
        config,
      });

      const cdiProvider = providers.find((p) => p.provide === 'cdiService');
      assert.instanceOf(cdiProvider.useValue.applicationContext, ApplicationContext);
    });
  });
});
