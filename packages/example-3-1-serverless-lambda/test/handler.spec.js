/**
 * example-3-1-serverless-lambda — handler tests
 *
 * Tests the Lambda handler directly using API Gateway v2 event shapes.
 * No AWS account, no SAM, no network required.
 */
import { assert } from 'chai';
import { handler } from '../handler.js';

function makeEvent(method, path, params = {}, body = null) {
  return {
    version: '2.0',
    routeKey: `${method} ${path}`,
    rawPath: path,
    pathParameters: params,
    queryStringParameters: {},
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : null,
    isBase64Encoded: false,
  };
}

describe('Lambda handler', () => {
  it('GET /health → 200 with status ok', async () => {
    const res = await handler(makeEvent('GET', '/health'), {});
    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.status, 'ok');
    assert.equal(body.app, 'Lambda Example');
  });

  it('GET /greet/{name} → 200 with greeting', async () => {
    const res = await handler(makeEvent('GET', '/greet/{name}', { name: 'World' }), {});
    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.message, 'Hello, World!');
  });

  it('GET /greet/{name} → 200 with Alt-JavaScript', async () => {
    const res = await handler(makeEvent('GET', '/greet/{name}', { name: 'Alt-JavaScript' }), {});
    assert.equal(res.statusCode, 200);
    assert.equal(JSON.parse(res.body).message, 'Hello, Alt-JavaScript!');
  });

  it('unmatched route → 404', async () => {
    const res = await handler(makeEvent('GET', '/nonexistent'), {});
    assert.equal(res.statusCode, 404);
  });

  it('handler is reused across warm invocations (singleton)', async () => {
    const res1 = await handler(makeEvent('GET', '/health'), {});
    const res2 = await handler(makeEvent('GET', '/health'), {});
    assert.equal(res1.statusCode, 200);
    assert.equal(res2.statusCode, 200);
  });
});
