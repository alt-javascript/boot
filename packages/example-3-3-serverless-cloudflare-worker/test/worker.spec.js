/**
 * example-3-3-serverless-cloudflare-worker — worker tests
 *
 * Tests the Worker fetch handler using Web Standards Request objects.
 * No Wrangler, no Miniflare, no network required.
 */
import { assert } from 'chai';
import worker from '../worker.js';

function makeRequest(method, url) {
  return new Request(url, { method });
}

describe('Cloudflare Worker fetch handler', () => {
  it('GET /health → 200 with status ok', async () => {
    const res = await worker.fetch(makeRequest('GET', 'http://localhost/health'), {}, {});
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'ok');
    assert.equal(body.app, 'Cloudflare Worker Example');
  });

  it('GET /greet/:name → 200 with greeting', async () => {
    const res = await worker.fetch(makeRequest('GET', 'http://localhost/greet/World'), {}, {});
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.message, 'Hello, World!');
  });

  it('GET /greet/:name → 200 with Alt-JavaScript', async () => {
    const res = await worker.fetch(makeRequest('GET', 'http://localhost/greet/Alt-JavaScript'), {}, {});
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.message, 'Hello, Alt-JavaScript!');
  });

  it('unmatched route → 404', async () => {
    const res = await worker.fetch(makeRequest('GET', 'http://localhost/nonexistent'), {}, {});
    assert.equal(res.status, 404);
  });

  it('worker is reused across warm invocations (singleton)', async () => {
    const res1 = await worker.fetch(makeRequest('GET', 'http://localhost/health'), {}, {});
    const res2 = await worker.fetch(makeRequest('GET', 'http://localhost/health'), {}, {});
    assert.equal(res1.status, 200);
    assert.equal(res2.status, 200);
  });
});
