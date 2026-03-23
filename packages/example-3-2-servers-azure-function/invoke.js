/**
 * invoke.js — local Azure Function test harness
 *
 * Simulates Azure Functions v4 HTTP trigger requests against the handler.
 *
 *   npm run invoke        # default profile (Hello)
 *   npm run invoke:dev    # dev profile (G'day)
 */
import { handler } from './handler.js';

function makeRequest(method, url, params = {}, body = null) {
  return { method, url, params, query: {}, headers: {}, body };
}

async function invoke(label, request) {
  const result = await handler(request, {});
  console.log(`${label} [${result.status}]`, JSON.stringify(result.jsonBody));
}

await invoke('GET /health',       makeRequest('GET', '/health'));
await invoke('GET /greet/World',  makeRequest('GET', '/greet/World', { name: 'World' }));
await invoke('GET /greet/Azure',  makeRequest('GET', '/greet/Azure', { name: 'Azure' }));
await invoke('GET /missing',      makeRequest('GET', '/missing'));
