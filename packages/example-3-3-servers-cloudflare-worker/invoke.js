/**
 * invoke.js — local Cloudflare Worker test harness
 *
 * Simulates Worker fetch events using Web Standards Request objects.
 *
 *   npm run invoke        # default profile (Hello)
 *   npm run invoke:dev    # dev profile (G'day)
 */
import worker from './worker.js';

async function invoke(label, method, url) {
  const request = new Request(url, { method });
  const response = await worker.fetch(request, {}, {});
  const body = await response.json();
  console.log(`${label} [${response.status}]`, JSON.stringify(body));
}

await invoke('GET /health',       'GET', 'http://localhost/health');
await invoke('GET /greet/World',  'GET', 'http://localhost/greet/World');
await invoke('GET /greet/CF',     'GET', 'http://localhost/greet/CF');
await invoke('GET /missing',      'GET', 'http://localhost/missing');
