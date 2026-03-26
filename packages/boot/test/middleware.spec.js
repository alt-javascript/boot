/* eslint-disable import/extensions */
import { assert } from 'chai';
import RequestLoggerMiddleware from '../middleware/RequestLoggerMiddleware.js';
import ErrorHandlerMiddleware from '../middleware/ErrorHandlerMiddleware.js';
import NotFoundMiddleware from '../middleware/NotFoundMiddleware.js';

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeLogger() {
  const calls = { verbose: [], error: [] };
  return {
    calls,
    verbose: (msg) => calls.verbose.push(msg),
    error: (msg) => calls.error.push(msg),
  };
}

function makeCtx(logger, configOverrides = {}) {
  const entries = {
    // merge in any config keys for testing enabled flags
    ...configOverrides,
  };
  return {
    get: (name, def) => (name === 'logger' ? logger : def),
    config: {
      has: (key) => key in entries,
      get: (key) => entries[key],
    },
  };
}

// ─── RequestLoggerMiddleware ──────────────────────────────────────────────────

describe('RequestLoggerMiddleware', () => {
  it('has __middleware.order === 10', () => {
    assert.equal(RequestLoggerMiddleware.__middleware.order, 10);
  });

  it('calls next and returns its result', async () => {
    const mw = new RequestLoggerMiddleware();
    mw.setApplicationContext(makeCtx(makeLogger()));

    const next = async (req) => ({ statusCode: 200, body: req });
    const result = await mw.handle({ method: 'GET', path: '/test' }, next);
    assert.equal(result.statusCode, 200);
  });

  it('logs method/path/status/duration on success', async () => {
    const logger = makeLogger();
    const mw = new RequestLoggerMiddleware();
    mw.setApplicationContext(makeCtx(logger));

    await mw.handle({ method: 'GET', path: '/greet' }, async () => ({ statusCode: 200 }));

    assert.equal(logger.calls.verbose.length, 1);
    assert.match(logger.calls.verbose[0], /\[GET\] \/greet → 200 \(\d+ms\)/);
  });

  it('logs error and re-throws when next throws', async () => {
    const logger = makeLogger();
    const mw = new RequestLoggerMiddleware();
    mw.setApplicationContext(makeCtx(logger));

    try {
      await mw.handle({ method: 'POST', path: '/fail' }, async () => { throw new Error('boom'); });
      assert.fail('should have thrown');
    } catch (err) {
      assert.equal(err.message, 'boom');
      assert.equal(logger.calls.error.length, 1);
      assert.include(logger.calls.error[0], 'boom');
    }
  });

  it('passes through when disabled via config', async () => {
    const logger = makeLogger();
    const mw = new RequestLoggerMiddleware();
    mw.setApplicationContext(makeCtx(logger, { 'middleware.requestLogger.enabled': false }));

    await mw.handle({ method: 'GET', path: '/x' }, async () => ({ statusCode: 200 }));
    assert.equal(logger.calls.verbose.length, 0);
  });

  it('works without an applicationContext (no crash)', async () => {
    const mw = new RequestLoggerMiddleware();
    const result = await mw.handle({ method: 'GET', path: '/x' }, async () => ({ statusCode: 200 }));
    assert.equal(result.statusCode, 200);
  });
});

// ─── ErrorHandlerMiddleware ───────────────────────────────────────────────────

describe('ErrorHandlerMiddleware', () => {
  it('has __middleware.order === 20', () => {
    assert.equal(ErrorHandlerMiddleware.__middleware.order, 20);
  });

  it('passes through when next succeeds', async () => {
    const mw = new ErrorHandlerMiddleware();
    mw.setApplicationContext(makeCtx(makeLogger()));

    const result = await mw.handle({}, async () => ({ statusCode: 200, body: { ok: true } }));
    assert.equal(result.statusCode, 200);
  });

  it('catches thrown error and returns 500 with body', async () => {
    const mw = new ErrorHandlerMiddleware();
    mw.setApplicationContext(makeCtx(makeLogger()));

    const result = await mw.handle({}, async () => { throw new Error('database exploded'); });
    assert.equal(result.statusCode, 500);
    assert.deepEqual(result.body, { error: 'database exploded' });
  });

  it('uses err.statusCode when present', async () => {
    const mw = new ErrorHandlerMiddleware();
    mw.setApplicationContext(makeCtx(makeLogger()));

    const err = new Error('not allowed');
    err.statusCode = 403;

    const result = await mw.handle({}, async () => { throw err; });
    assert.equal(result.statusCode, 403);
    assert.deepEqual(result.body, { error: 'not allowed' });
  });

  it('logs the error via CDI logger', async () => {
    const logger = makeLogger();
    const mw = new ErrorHandlerMiddleware();
    mw.setApplicationContext(makeCtx(logger));

    await mw.handle({}, async () => { throw new Error('something went wrong'); });
    assert.equal(logger.calls.error.length, 1);
    assert.include(logger.calls.error[0], 'something went wrong');
  });

  it('passes through when disabled via config', async () => {
    const mw = new ErrorHandlerMiddleware();
    mw.setApplicationContext(makeCtx(makeLogger(), { 'middleware.errorHandler.enabled': false }));

    try {
      await mw.handle({}, async () => { throw new Error('unhandled'); });
      assert.fail('should have thrown');
    } catch (err) {
      assert.equal(err.message, 'unhandled');
    }
  });
});

// ─── NotFoundMiddleware ───────────────────────────────────────────────────────

describe('NotFoundMiddleware', () => {
  it('has __middleware.order === 30', () => {
    assert.equal(NotFoundMiddleware.__middleware.order, 30);
  });

  it('passes through non-null results', async () => {
    const mw = new NotFoundMiddleware();
    mw.setApplicationContext(makeCtx(makeLogger()));

    const result = await mw.handle({}, async () => ({ statusCode: 200, body: { data: 1 } }));
    assert.equal(result.statusCode, 200);
  });

  it('converts null result to 404', async () => {
    const mw = new NotFoundMiddleware();
    mw.setApplicationContext(makeCtx(makeLogger()));

    const result = await mw.handle({}, async () => null);
    assert.equal(result.statusCode, 404);
    assert.deepEqual(result.body, { error: 'Not found' });
  });

  it('converts undefined result to 404', async () => {
    const mw = new NotFoundMiddleware();
    mw.setApplicationContext(makeCtx(makeLogger()));

    const result = await mw.handle({}, async () => undefined);
    assert.equal(result.statusCode, 404);
    assert.deepEqual(result.body, { error: 'Not found' });
  });

  it('passes through when disabled via config', async () => {
    const mw = new NotFoundMiddleware();
    mw.setApplicationContext(makeCtx(makeLogger(), { 'middleware.notFound.enabled': false }));

    const result = await mw.handle({}, async () => null);
    assert.isNull(result);
  });
});
