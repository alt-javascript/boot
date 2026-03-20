import { assert } from 'chai';
import { EphemeralConfig } from '@alt-javascript/config';
import { ApplicationContext } from '@alt-javascript/cdi';
import { Context } from '@alt-javascript/cdi/context/index.js';
import { fastifyAutoConfiguration, FastifyAdapter } from '../index.js';

// --- Test service (framework-agnostic — identical to Express tests) ---
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

  async greet(request, reply) {
    const message = this.greetingService.greet(request.params.name);
    return { message };
  }

  async health(request, reply) {
    return { status: 'ok' };
  }

  async echo(request, reply) {
    return { received: request.body };
  }
}

// --- Test controller using imperative routes() ---
class ImperativeController {
  constructor() {
    this.greetingService = null; // autowired
  }

  routes(fastify, ctx) {
    fastify.get('/imperative', async (request, reply) => {
      const svc = ctx.get('greetingService');
      return { from: 'imperative', greeting: svc.greet('world') };
    });
  }
}

// --- Test controller accessing ctx from request ---
class ContextAccessController {
  static __routes = [
    { method: 'GET', path: '/ctx-test', handler: 'test' },
  ];

  async test(request, reply) {
    const ctx = request.ctx;
    const svc = ctx.get('greetingService');
    return { greeting: svc.greet('ctx') };
  }
}

// --- Helper to build a test app context ---
async function buildContext(configOverrides = {}) {
  const config = new EphemeralConfig({
    server: { port: 0 },
    ...configOverrides,
  });

  const context = new Context([
    ...fastifyAutoConfiguration(),
    { Reference: GreetingService, name: 'greetingService', scope: 'singleton' },
    { Reference: GreetingController, name: 'greetingController', scope: 'singleton' },
    { Reference: ImperativeController, name: 'imperativeController', scope: 'singleton' },
    { Reference: ContextAccessController, name: 'contextAccessController', scope: 'singleton' },
  ]);

  const appCtx = new ApplicationContext({ contexts: [context], config });
  await appCtx.start({ run: false });
  return appCtx;
}

describe('Fastify Adapter', () => {
  let appCtx;

  afterEach(async () => {
    if (appCtx) {
      const adapter = appCtx.get('fastifyAdapter', null);
      if (adapter && typeof adapter.destroy === 'function') {
        await adapter.destroy();
      }
    }
  });

  describe('boot lifecycle', () => {
    it('creates a Fastify instance via auto-configuration', async () => {
      appCtx = await buildContext();
      const adapter = appCtx.get('fastifyAdapter');
      assert.instanceOf(adapter, FastifyAdapter);
      assert.exists(adapter.fastify);
    });

    it('decorates Fastify with ctx', async () => {
      appCtx = await buildContext();
      const adapter = appCtx.get('fastifyAdapter');
      assert.strictEqual(adapter.fastify.ctx, appCtx);
    });

    it('reads server.port from config', async () => {
      appCtx = await buildContext({ server: { port: 9999 } });
      const adapter = appCtx.get('fastifyAdapter');
      assert.equal(adapter._port, 9999);
    });

    it('defaults to port 3000 when not configured', async () => {
      const config = new EphemeralConfig({});
      const context = new Context([...fastifyAutoConfiguration()]);
      appCtx = new ApplicationContext({ contexts: [context], config });
      await appCtx.start({ run: false });
      const adapter = appCtx.get('fastifyAdapter');
      assert.equal(adapter._port, 3000);
    });
  });

  describe('controller auto-registration (__routes)', () => {
    it('registers GET route from __routes metadata', async () => {
      appCtx = await buildContext();
      const adapter = appCtx.get('fastifyAdapter');

      const res = await adapter.fastify.inject({
        method: 'GET',
        url: '/greet/Alice',
      });

      assert.equal(res.statusCode, 200);
      assert.deepEqual(JSON.parse(res.payload), { message: 'Hello, Alice!' });
    });

    it('registers POST route with JSON body parsing', async () => {
      appCtx = await buildContext();
      const adapter = appCtx.get('fastifyAdapter');

      const res = await adapter.fastify.inject({
        method: 'POST',
        url: '/echo',
        payload: { key: 'value' },
      });

      assert.equal(res.statusCode, 200);
      assert.deepEqual(JSON.parse(res.payload), { received: { key: 'value' } });
    });

    it('autowires service into controller', async () => {
      appCtx = await buildContext();
      const controller = appCtx.get('greetingController');
      assert.instanceOf(controller.greetingService, GreetingService);
    });

    it('health endpoint works', async () => {
      appCtx = await buildContext();
      const adapter = appCtx.get('fastifyAdapter');

      const res = await adapter.fastify.inject({
        method: 'GET',
        url: '/health',
      });

      assert.equal(res.statusCode, 200);
      assert.deepEqual(JSON.parse(res.payload), { status: 'ok' });
    });
  });

  describe('imperative routes() pattern', () => {
    it('registers routes via routes(fastify, ctx) method', async () => {
      appCtx = await buildContext();
      const adapter = appCtx.get('fastifyAdapter');

      const res = await adapter.fastify.inject({
        method: 'GET',
        url: '/imperative',
      });

      assert.equal(res.statusCode, 200);
      assert.deepEqual(JSON.parse(res.payload), {
        from: 'imperative',
        greeting: 'Hello, world!',
      });
    });
  });

  describe('context access from handlers', () => {
    it('accesses CDI beans via request.ctx', async () => {
      appCtx = await buildContext();
      const adapter = appCtx.get('fastifyAdapter');

      const res = await adapter.fastify.inject({
        method: 'GET',
        url: '/ctx-test',
      });

      assert.equal(res.statusCode, 200);
      assert.deepEqual(JSON.parse(res.payload), { greeting: 'Hello, ctx!' });
    });
  });

  describe('error handling', () => {
    it('returns 404 for unregistered routes', async () => {
      appCtx = await buildContext();
      const adapter = appCtx.get('fastifyAdapter');

      const res = await adapter.fastify.inject({
        method: 'GET',
        url: '/nonexistent',
      });

      assert.equal(res.statusCode, 404);
    });
  });

  describe('does not replace existing adapter', () => {
    it('skips auto-config when fastifyAdapter already registered', async () => {
      const customAdapter = { custom: true };
      const config = new EphemeralConfig({});
      const context = new Context([
        { Reference: customAdapter, name: 'fastifyAdapter', scope: 'singleton' },
        ...fastifyAutoConfiguration(),
      ]);
      appCtx = new ApplicationContext({ contexts: [context], config });
      await appCtx.start({ run: false });

      const adapter = appCtx.get('fastifyAdapter');
      assert.equal(adapter.custom, true);
    });
  });
});
