/**
 * invoke.js — local Lambda test harness
 *
 * Simulates API Gateway HTTP API v2 events against the handler.
 * Use this instead of SAM local for quick smoke testing.
 *
 *   npm run invoke        # default profile (Hello)
 *   npm run invoke:dev    # dev profile (G'day)
 */
import { handler } from './handler.js';

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

async function invoke(label, event) {
  const result = await handler(event, {});
  const body = JSON.parse(result.body || '""');
  console.log(`${label} [${result.statusCode}]`, JSON.stringify(body));
}

await invoke('GET /health',       makeEvent('GET', '/health'));
await invoke('GET /greet/World',  makeEvent('GET', '/greet/{name}', { name: 'World' }));
await invoke('GET /greet/Lambda', makeEvent('GET', '/greet/{name}', { name: 'Lambda' }));
await invoke('GET /missing',      makeEvent('GET', '/missing'));
