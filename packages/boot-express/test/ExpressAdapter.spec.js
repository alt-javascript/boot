import { assert } from 'chai';
import supertest from 'supertest';
import { EphemeralConfig } from '@alt-javascript/config';
import { ApplicationContext } from '@alt-javascript/cdi';
import { Context } from '@alt-javascript/cdi/context/index.js';
import { expressStarter, ExpressAdapter } from '../index.js';

// --- Test service (framework-agnostic) ---
class GreetingService {
  greet(name) {
    return `Hello, ${name}!`;
  }
}

// --- Test controller using __routes metadata ---
class GreetingController {
  static __routes = [
    { method: 'GET', path: '/greet/:name', handler: 'greet' },
    { method: 'GET', path: '/health', handler: 'health' },
    { method: 'POST', path: '/echo', handler: 'echo' },
  ];

  constructor() {
    this.greetingService = null; // autowired
  }

  async greet(req, res) {
    const message = this.greetingService.greet(req.params.name);
    res.json({ message });
  }

  async health(req, res) {
    res.json({ status: 'ok' });
  }

  async echo(req, res) {
    res.json({ received: req.body });
  }
}

// --- Test controller using imperative routes() ---
class ImperativeController {
  constructor() {
    this.greetingService = null; // autowired
  }

  routes(app, ctx) {
    app.get('/imperative', (req, res) => {
      const svc = ctx.get('greetingService');
      res.json({ from: 'imperative', greeting: svc.greet('world') });
    });
  }
}

// --- Test controller accessing ctx from app.locals ---
class ContextAccessController {
  static __routes = [
    { method: 'GET', path: '/ctx-test', handler: 'test' },
  ];

  async test(req, res) {
    const ctx = req.app.locals.ctx;
    const svc = ctx.get('greetingService');
    res.json({ greeting: svc.greet('ctx') });
  }
}

// --- Helper to build a test app context ---
async function buildContext(configOverrides = {}) {
  const config = new EphemeralConfig({
    server: { port: 0 }, // port 0 = don't actually listen
    ...configOverrides,
  });

  const context = new Context([
    ...expressStarter(),
    { Reference: GreetingService, name: 'greetingService', scope: 'singleton' },
    { Reference: GreetingController, name: 'greetingController', scope: 'singleton' },
    { Reference: ImperativeController, name: 'imperativeController', scope: 'singleton' },
    { Reference: ContextAccessController, name: 'contextAccessController', scope: 'singleton' },
  ]);

  const appCtx = new ApplicationContext({ contexts: [context], config });
  await appCtx.start({ run: false }); // don't listen
  return appCtx;
}

describe('Express Adapter', () => {
  let appCtx;

  afterEach(() => {
    if (appCtx) {
      const adapter = appCtx.get('expressAdapter', null);
      if (adapter && typeof adapter.destroy === 'function') adapter.destroy();
    }
  });

  describe('boot lifecycle', () => {
    it('creates an Express app via auto-configuration', async () => {
      appCtx = await buildContext();
      const adapter = appCtx.get('expressAdapter');
      assert.instanceOf(adapter, ExpressAdapter);
      assert.exists(adapter.app);
    });

    it('sets ApplicationContext on app.locals.ctx', async () => {
      appCtx = await buildContext();
      const adapter = appCtx.get('expressAdapter');
      assert.strictEqual(adapter.app.locals.ctx, appCtx);
    });

    it('reads server.port from config', async () => {
      appCtx = await buildContext({ server: { port: 9999 } });
      const adapter = appCtx.get('expressAdapter');
      assert.equal(adapter._port, 9999);
    });

    it('defaults to port 3000 when not configured', async () => {
      const config = new EphemeralConfig({});
      const context = new Context([...expressStarter()]);
      appCtx = new ApplicationContext({ contexts: [context], config });
      await appCtx.start({ run: false });
      const adapter = appCtx.get('expressAdapter');
      assert.equal(adapter._port, 3000);
    });
  });

  describe('controller auto-registration (__routes)', () => {
    it('registers GET route from __routes metadata', async () => {
      appCtx = await buildContext();
      const adapter = appCtx.get('expressAdapter');

      const res = await supertest(adapter.app)
        .get('/greet/Alice')
        .expect(200);

      assert.deepEqual(res.body, { message: 'Hello, Alice!' });
    });

    it('registers POST route with JSON body parsing', async () => {
      appCtx = await buildContext();
      const adapter = appCtx.get('expressAdapter');

      const res = await supertest(adapter.app)
        .post('/echo')
        .send({ key: 'value' })
        .expect(200);

      assert.deepEqual(res.body, { received: { key: 'value' } });
    });

    it('autowires service into controller', async () => {
      appCtx = await buildContext();
      const controller = appCtx.get('greetingController');
      assert.instanceOf(controller.greetingService, GreetingService);
    });

    it('health endpoint works', async () => {
      appCtx = await buildContext();
      const adapter = appCtx.get('expressAdapter');

      const res = await supertest(adapter.app)
        .get('/health')
        .expect(200);

      assert.deepEqual(res.body, { status: 'ok' });
    });
  });

  describe('imperative routes() pattern', () => {
    it('registers routes via routes(app, ctx) method', async () => {
      appCtx = await buildContext();
      const adapter = appCtx.get('expressAdapter');

      const res = await supertest(adapter.app)
        .get('/imperative')
        .expect(200);

      assert.deepEqual(res.body, {
        from: 'imperative',
        greeting: 'Hello, world!',
      });
    });
  });

  describe('context access from handlers', () => {
    it('accesses CDI beans via req.app.locals.ctx', async () => {
      appCtx = await buildContext();
      const adapter = appCtx.get('expressAdapter');

      const res = await supertest(adapter.app)
        .get('/ctx-test')
        .expect(200);

      assert.deepEqual(res.body, { greeting: 'Hello, ctx!' });
    });
  });

  describe('error handling', () => {
    it('returns 404 for unregistered routes', async () => {
      appCtx = await buildContext();
      const adapter = appCtx.get('expressAdapter');

      await supertest(adapter.app)
        .get('/nonexistent')
        .expect(404);
    });
  });

  describe('does not replace existing adapter', () => {
    it('skips auto-config when expressAdapter already registered', async () => {
      const customAdapter = { custom: true };
      const config = new EphemeralConfig({});
      const context = new Context([
        { Reference: customAdapter, name: 'expressAdapter', scope: 'singleton' },
        ...expressStarter(),
      ]);
      appCtx = new ApplicationContext({ contexts: [context], config });
      await appCtx.start({ run: false });

      const adapter = appCtx.get('expressAdapter');
      assert.equal(adapter.custom, true);
    });
  });
});
