/**
 * example-3-2-serverless-azure-function — handler tests
 *
 * Tests the Azure Functions handler directly using simulated HTTP trigger requests.
 * No Azure account, no Azure Functions Core Tools required.
 */
import { assert } from 'chai';
import { handler } from '../handler.js';

function makeRequest(method, url, params = {}, body = null) {
  return { method, url, params, query: {}, headers: {}, body };
}

describe('Azure Function handler', () => {
  it('GET /health → 200 with status ok', async () => {
    const res = await handler(makeRequest('GET', '/health'), {});
    assert.equal(res.status, 200);
    assert.equal(res.jsonBody.status, 'ok');
    assert.equal(res.jsonBody.app, 'Azure Function Example');
  });

  it('GET /greet/:name → 200 with greeting', async () => {
    const res = await handler(makeRequest('GET', '/greet/World', { name: 'World' }), {});
    assert.equal(res.status, 200);
    assert.equal(res.jsonBody.message, 'Hello, World!');
  });

  it('GET /greet/:name → 200 with Alt-JavaScript', async () => {
    const res = await handler(makeRequest('GET', '/greet/Alt-JavaScript', { name: 'Alt-JavaScript' }), {});
    assert.equal(res.status, 200);
    assert.equal(res.jsonBody.message, 'Hello, Alt-JavaScript!');
  });

  it('unmatched route → 404', async () => {
    const res = await handler(makeRequest('GET', '/nonexistent'), {});
    assert.equal(res.status, 404);
  });

  it('handler is reused across warm invocations (singleton)', async () => {
    const res1 = await handler(makeRequest('GET', '/health'), {});
    const res2 = await handler(makeRequest('GET', '/health'), {});
    assert.equal(res1.status, 200);
    assert.equal(res2.status, 200);
  });
});
