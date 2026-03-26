/* eslint-disable import/extensions */
import { assert } from 'chai';
import MiddlewarePipeline from '../MiddlewarePipeline.js';

describe('MiddlewarePipeline', () => {
  // ─── helpers ──────────────────────────────────────────────────────────────

  function makeMiddleware(order, fn) {
    class MW {
      async handle(request, next) {
        return fn(request, next);
      }
    }
    MW.__middleware = { order };
    return new MW();
  }

  const echo = async (request) => ({ statusCode: 200, body: request });

  // ─── compose() ────────────────────────────────────────────────────────────

  describe('compose()', () => {
    it('empty middleware list — finalHandler called directly', async () => {
      const pipeline = MiddlewarePipeline.compose([], echo);
      const result = await pipeline({ id: 1 });
      assert.equal(result.statusCode, 200);
      assert.deepEqual(result.body, { id: 1 });
    });

    it('single middleware that calls next — finalHandler receives request', async () => {
      const log = [];
      const mw = makeMiddleware(10, async (req, next) => {
        log.push('before');
        const res = await next(req);
        log.push('after');
        return res;
      });
      const pipeline = MiddlewarePipeline.compose([mw], echo);
      const result = await pipeline({ id: 2 });
      assert.deepEqual(log, ['before', 'after']);
      assert.equal(result.statusCode, 200);
    });

    it('multiple middlewares execute in array order (outermost first)', async () => {
      const log = [];
      const mw1 = makeMiddleware(10, async (req, next) => { log.push('mw1-in'); const r = await next(req); log.push('mw1-out'); return r; });
      const mw2 = makeMiddleware(20, async (req, next) => { log.push('mw2-in'); const r = await next(req); log.push('mw2-out'); return r; });
      const mw3 = makeMiddleware(30, async (req, next) => { log.push('mw3-in'); const r = await next(req); log.push('mw3-out'); return r; });

      // compose() executes in the order given; collect() is responsible for sorting by __middleware.order
      const pipeline = MiddlewarePipeline.compose([mw1, mw2, mw3], echo);
      await pipeline({});
      assert.deepEqual(log, ['mw1-in', 'mw2-in', 'mw3-in', 'mw3-out', 'mw2-out', 'mw1-out']);
    });

    it('short-circuit — middleware returns early, finalHandler never called', async () => {
      let handlerCalled = false;
      const finalHandler = async () => { handlerCalled = true; return { statusCode: 200 }; };

      const blocker = makeMiddleware(5, async () => ({ statusCode: 401, body: { error: 'Unauthorized' } }));
      const pipeline = MiddlewarePipeline.compose([blocker], finalHandler);

      const result = await pipeline({ headers: {} });
      assert.equal(result.statusCode, 401);
      assert.isFalse(handlerCalled);
    });

    it('short-circuit stops downstream middleware too', async () => {
      const log = [];
      const blocker = makeMiddleware(10, async () => { log.push('blocker'); return { statusCode: 403 }; });
      const downstream = makeMiddleware(20, async (req, next) => { log.push('downstream'); return next(req); });
      const pipeline = MiddlewarePipeline.compose([blocker, downstream], echo);

      await pipeline({});
      assert.deepEqual(log, ['blocker']);
    });

    it('request mutation — downstream middleware and handler see added properties', async () => {
      const injector = makeMiddleware(5, async (req, next) => {
        return next({ ...req, user: { id: 42 } });
      });

      let seenRequest = null;
      const handler = async (req) => { seenRequest = req; return { statusCode: 200 }; };
      const pipeline = MiddlewarePipeline.compose([injector], handler);

      await pipeline({ headers: {} });
      assert.equal(seenRequest.user.id, 42);
    });

    it('middleware that throws — exception propagates out of pipeline', async () => {
      const boom = makeMiddleware(5, async () => { throw new Error('kaboom'); });
      const pipeline = MiddlewarePipeline.compose([boom], echo);

      try {
        await pipeline({});
        assert.fail('should have thrown');
      } catch (err) {
        assert.equal(err.message, 'kaboom');
      }
    });

    it('middleware passes undefined to next — uses original request', async () => {
      let seenRequest = null;
      const passthrough = makeMiddleware(5, async (req, next) => next(undefined));
      const handler = async (req) => { seenRequest = req; return { statusCode: 200 }; };
      const pipeline = MiddlewarePipeline.compose([passthrough], handler);

      const original = { tag: 'original' };
      await pipeline(original);
      assert.equal(seenRequest.tag, 'original');
    });
  });

  // ─── collect() ────────────────────────────────────────────────────────────

  describe('collect()', () => {
    function buildContext(entries) {
      const components = {};
      for (const { name, Reference, instance } of entries) {
        components[name] = { Reference, instance };
      }
      return { components };
    }

    it('returns only components whose class has __middleware', () => {
      class AuthMW { async handle() {} }
      AuthMW.__middleware = { order: 10 };

      class PlainService {}

      const ctx = buildContext([
        { name: 'authMW', Reference: AuthMW, instance: new AuthMW() },
        { name: 'plainService', Reference: PlainService, instance: new PlainService() },
      ]);

      const result = MiddlewarePipeline.collect(ctx);
      assert.equal(result.length, 1);
      assert.instanceOf(result[0], AuthMW);
    });

    it('returns instances sorted by ascending order', () => {
      class A { async handle() {} } A.__middleware = { order: 30 };
      class B { async handle() {} } B.__middleware = { order: 10 };
      class C { async handle() {} } C.__middleware = { order: 20 };

      const ctx = buildContext([
        { name: 'a', Reference: A, instance: new A() },
        { name: 'b', Reference: B, instance: new B() },
        { name: 'c', Reference: C, instance: new C() },
      ]);

      const result = MiddlewarePipeline.collect(ctx);
      assert.instanceOf(result[0], B);
      assert.instanceOf(result[1], C);
      assert.instanceOf(result[2], A);
    });

    it('unordered middleware (no order property) goes last', () => {
      class Ordered { async handle() {} } Ordered.__middleware = { order: 5 };
      class Unordered { async handle() {} } Unordered.__middleware = {};

      const ctx = buildContext([
        { name: 'unordered', Reference: Unordered, instance: new Unordered() },
        { name: 'ordered', Reference: Ordered, instance: new Ordered() },
      ]);

      const result = MiddlewarePipeline.collect(ctx);
      assert.instanceOf(result[0], Ordered);
      assert.instanceOf(result[1], Unordered);
    });

    it('skips components without an instance', () => {
      class AuthMW { async handle() {} } AuthMW.__middleware = { order: 1 };

      const ctx = buildContext([
        { name: 'authMW', Reference: AuthMW, instance: null },
      ]);

      const result = MiddlewarePipeline.collect(ctx);
      assert.equal(result.length, 0);
    });

    it('empty context returns empty array', () => {
      const ctx = buildContext([]);
      assert.deepEqual(MiddlewarePipeline.collect(ctx), []);
    });
  });
});
