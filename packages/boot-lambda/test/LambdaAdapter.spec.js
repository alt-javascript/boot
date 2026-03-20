import { assert } from 'chai';
import { EphemeralConfig } from '@alt-javascript/config';
import { ApplicationContext } from '@alt-javascript/cdi';
import { Context } from '@alt-javascript/cdi/context/index.js';
import {
  createLambdaHandler,
  lambdaAutoConfiguration,
  LambdaAdapter,
  LambdaAdapterFactory,
} from '../index.js';

// --- Test service (framework-agnostic — identical across all adapters) ---
class GreetingService {
  greet(name) {
    return `Hello, ${name}!`;
  }
}

// --- Test controller using __routes metadata ---
class GreetingController {
  static __routes = [
    { method: 'GET', path: '/greet/{name}', handler: 'greet' },
    { method: 'GET', path: '/health', handler: 'health' },
    { method: 'POST', path: '/echo', handler: 'echo' },
  ];

  constructor() {
    this.greetingService = null; // autowired
  }

  async greet(request) {
    const message = this.greetingService.greet(request.params.name);
    return { message };
  }

  async health() {
    return { status: 'ok' };
  }

  async echo(request) {
    return { received: request.body };
  }
}

// --- Controller that returns explicit statusCode ---
class StatusController {
  static __routes = [
    { method: 'POST', path: '/items', handler: 'create' },
    { method: 'DELETE', path: '/items/{id}', handler: 'remove' },
  ];

  async create(request) {
    return { statusCode: 201, body: { created: true, title: request.body.title } };
  }

  async remove() {
    return { statusCode: 204 };
  }
}

// --- Controller that throws errors ---
class ErrorController {
  static __routes = [
    { method: 'GET', path: '/error/500', handler: 'serverError' },
    { method: 'GET', path: '/error/custom', handler: 'customError' },
  ];

  async serverError() {
    throw new Error('Something went wrong');
  }

  async customError() {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }
}

// --- Imperative controller ---
class ImperativeController {
  constructor() {
    this.greetingService = null; // autowired
  }

  routes(router, ctx) {
    router.set('GET /imperative', {
      handler: async (request) => {
        const svc = request.ctx.get('greetingService');
        return { from: 'imperative', greeting: svc.greet('world') };
      },
    });
  }
}

// --- Controller with :param style (auto-converted to {param}) ---
class ExpressStyleController {
  static __routes = [
    { method: 'GET', path: '/users/:userId/posts/:postId', handler: 'getPost' },
  ];

  async getPost(request) {
    return { userId: request.params.userId, postId: request.params.postId };
  }
}

// --- Helper: build API Gateway v2 event ---
function apiEvent(routeKey, overrides = {}) {
  return {
    routeKey,
    pathParameters: {},
    queryStringParameters: {},
    headers: { 'content-type': 'application/json' },
    body: null,
    isBase64Encoded: false,
    requestContext: {
      http: {
        method: routeKey.split(' ')[0],
        path: routeKey.split(' ')[1],
      },
    },
    ...overrides,
  };
}

// --- Helper: build a CDI context ---
async function buildContext(configOverrides = {}) {
  const config = new EphemeralConfig(configOverrides);
  const context = new Context([
    ...lambdaAutoConfiguration(),
    { Reference: GreetingService, name: 'greetingService', scope: 'singleton' },
    { Reference: GreetingController, name: 'greetingController', scope: 'singleton' },
    { Reference: StatusController, name: 'statusController', scope: 'singleton' },
    { Reference: ErrorController, name: 'errorController', scope: 'singleton' },
    { Reference: ImperativeController, name: 'imperativeController', scope: 'singleton' },
    { Reference: ExpressStyleController, name: 'expressStyleController', scope: 'singleton' },
  ]);

  const appCtx = new ApplicationContext({ contexts: [context], config });
  await appCtx.start({ run: false });
  return appCtx;
}

describe('Lambda Adapter', () => {
  let appCtx;

  afterEach(() => {
    appCtx = null;
  });

  describe('boot lifecycle', () => {
    it('creates a LambdaAdapter via auto-configuration', async () => {
      appCtx = await buildContext();
      const adapter = appCtx.get('lambdaAdapter');
      assert.instanceOf(adapter, LambdaAdapterFactory);
      assert.isAbove(adapter.routeCount, 0);
    });

    it('registers routes from __routes metadata', async () => {
      appCtx = await buildContext();
      const adapter = appCtx.get('lambdaAdapter');
      // 3 (greeting) + 2 (status) + 2 (error) + 1 (imperative) + 1 (expressStyle) = 9
      assert.equal(adapter.routeCount, 9);
    });
  });

  describe('route dispatch', () => {
    it('GET route returns service data', async () => {
      appCtx = await buildContext();
      const adapter = appCtx.get('lambdaAdapter');

      const res = await adapter.handle(
        apiEvent('GET /greet/{name}', { pathParameters: { name: 'Alice' } }),
      );

      assert.equal(res.statusCode, 200);
      assert.deepEqual(JSON.parse(res.body), { message: 'Hello, Alice!' });
    });

    it('GET health endpoint works', async () => {
      appCtx = await buildContext();
      const adapter = appCtx.get('lambdaAdapter');

      const res = await adapter.handle(apiEvent('GET /health'));
      assert.equal(res.statusCode, 200);
      assert.deepEqual(JSON.parse(res.body), { status: 'ok' });
    });

    it('POST route with JSON body', async () => {
      appCtx = await buildContext();
      const adapter = appCtx.get('lambdaAdapter');

      const res = await adapter.handle(
        apiEvent('POST /echo', { body: JSON.stringify({ key: 'value' }) }),
      );

      assert.equal(res.statusCode, 200);
      assert.deepEqual(JSON.parse(res.body), { received: { key: 'value' } });
    });

    it('POST route with base64 encoded body', async () => {
      appCtx = await buildContext();
      const adapter = appCtx.get('lambdaAdapter');

      const encoded = Buffer.from(JSON.stringify({ encoded: true })).toString('base64');
      const res = await adapter.handle(
        apiEvent('POST /echo', { body: encoded, isBase64Encoded: true }),
      );

      assert.equal(res.statusCode, 200);
      assert.deepEqual(JSON.parse(res.body), { received: { encoded: true } });
    });
  });

  describe('response normalization', () => {
    it('handler returning plain object → 200 JSON', async () => {
      appCtx = await buildContext();
      const adapter = appCtx.get('lambdaAdapter');

      const res = await adapter.handle(apiEvent('GET /health'));
      assert.equal(res.statusCode, 200);
      assert.equal(res.headers['Content-Type'], 'application/json');
    });

    it('handler returning { statusCode, body } → passthrough', async () => {
      appCtx = await buildContext();
      const adapter = appCtx.get('lambdaAdapter');

      const res = await adapter.handle(
        apiEvent('POST /items', { body: JSON.stringify({ title: 'Test' }) }),
      );

      assert.equal(res.statusCode, 201);
      assert.deepEqual(JSON.parse(res.body), { created: true, title: 'Test' });
    });

    it('handler returning 204 → empty body', async () => {
      appCtx = await buildContext();
      const adapter = appCtx.get('lambdaAdapter');

      const res = await adapter.handle(
        apiEvent('DELETE /items/{id}', { pathParameters: { id: '1' } }),
      );

      assert.equal(res.statusCode, 204);
    });
  });

  describe('error handling', () => {
    it('unhandled error → 500 with error message', async () => {
      appCtx = await buildContext();
      const adapter = appCtx.get('lambdaAdapter');

      const res = await adapter.handle(apiEvent('GET /error/500'));
      assert.equal(res.statusCode, 500);
      assert.deepEqual(JSON.parse(res.body), { error: 'Something went wrong' });
    });

    it('error with custom statusCode → preserves status', async () => {
      appCtx = await buildContext();
      const adapter = appCtx.get('lambdaAdapter');

      const res = await adapter.handle(apiEvent('GET /error/custom'));
      assert.equal(res.statusCode, 403);
      assert.deepEqual(JSON.parse(res.body), { error: 'Forbidden' });
    });

    it('unregistered route → 404', async () => {
      appCtx = await buildContext();
      const adapter = appCtx.get('lambdaAdapter');

      const res = await adapter.handle(apiEvent('GET /nonexistent'));
      assert.equal(res.statusCode, 404);
    });

    it('missing routeKey → 400', async () => {
      appCtx = await buildContext();
      const adapter = appCtx.get('lambdaAdapter');

      const res = await adapter.handle({});
      assert.equal(res.statusCode, 400);
    });
  });

  describe('imperative routes() pattern', () => {
    it('registers routes via routes(router, ctx) method', async () => {
      appCtx = await buildContext();
      const adapter = appCtx.get('lambdaAdapter');

      const res = await adapter.handle(apiEvent('GET /imperative'));
      assert.equal(res.statusCode, 200);
      assert.deepEqual(JSON.parse(res.body), {
        from: 'imperative',
        greeting: 'Hello, world!',
      });
    });
  });

  describe(':param to {param} conversion', () => {
    it('converts Express-style :param to API Gateway {param}', async () => {
      appCtx = await buildContext();
      const adapter = appCtx.get('lambdaAdapter');

      const res = await adapter.handle(
        apiEvent('GET /users/{userId}/posts/{postId}', {
          pathParameters: { userId: '42', postId: '7' },
        }),
      );

      assert.equal(res.statusCode, 200);
      assert.deepEqual(JSON.parse(res.body), { userId: '42', postId: '7' });
    });
  });

  describe('context access from handlers', () => {
    it('request.ctx provides the ApplicationContext', async () => {
      appCtx = await buildContext();
      const adapter = appCtx.get('lambdaAdapter');

      // The imperative controller uses request.ctx.get()
      const res = await adapter.handle(apiEvent('GET /imperative'));
      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.body);
      assert.equal(body.greeting, 'Hello, world!');
    });
  });

  describe('DI wiring', () => {
    it('autowires service into controller', async () => {
      appCtx = await buildContext();
      const controller = appCtx.get('greetingController');
      assert.instanceOf(controller.greetingService, GreetingService);
    });
  });

  describe('createLambdaHandler (standalone)', () => {
    it('boots CDI and handles events', async () => {
      const config = new EphemeralConfig({});
      const context = new Context([
        { Reference: GreetingService, name: 'greetingService', scope: 'singleton' },
        { Reference: GreetingController, name: 'greetingController', scope: 'singleton' },
      ]);

      const handler = createLambdaHandler({ contexts: [context], config });

      const res = await handler(
        apiEvent('GET /greet/{name}', { pathParameters: { name: 'Lambda' } }),
        { functionName: 'test' },
      );

      assert.equal(res.statusCode, 200);
      assert.deepEqual(JSON.parse(res.body), { message: 'Hello, Lambda!' });
    });

    it('reuses context on warm invocations', async () => {
      const config = new EphemeralConfig({});
      const context = new Context([
        { Reference: GreetingService, name: 'greetingService', scope: 'singleton' },
        { Reference: GreetingController, name: 'greetingController', scope: 'singleton' },
      ]);

      const handler = createLambdaHandler({ contexts: [context], config });

      // First call (cold start)
      const res1 = await handler(
        apiEvent('GET /health'),
        { functionName: 'test' },
      );
      assert.equal(res1.statusCode, 200);

      // Second call (warm invocation — same context)
      const res2 = await handler(
        apiEvent('GET /health'),
        { functionName: 'test' },
      );
      assert.equal(res2.statusCode, 200);
    });
  });

  describe('does not replace existing adapter', () => {
    it('skips auto-config when lambdaAdapter already registered', async () => {
      const customAdapter = { custom: true };
      const config = new EphemeralConfig({});
      const context = new Context([
        { Reference: customAdapter, name: 'lambdaAdapter', scope: 'singleton' },
        ...lambdaAutoConfiguration(),
      ]);
      appCtx = new ApplicationContext({ contexts: [context], config });
      await appCtx.start({ run: false });

      const adapter = appCtx.get('lambdaAdapter');
      assert.equal(adapter.custom, true);
    });
  });
});
