# S04: AWS Lambda Adapter

**Goal:** A reusable `@alt-javascript/boot-lambda` adapter that boots CDI once on cold start, routes API Gateway HTTP API events to controller methods via the same `__routes` convention, and returns Lambda-format responses. Same service layer, completely serverless.
**Demo:** Tests prove: CDI beans resolve from handlers, controllers auto-register routes via `__routes`, config reads from environment, cold-start boot happens once and warm invocations reuse the context.

## Must-Haves

- `LambdaAdapter` boots CDI context once on cold start, reuses on warm invocations
- Same `__routes` static metadata convention as Express/Fastify adapters
- Routes API Gateway HTTP API v2 events (`routeKey` → controller method)
- Controller handler signature: `async handler(event, ctx)` where `ctx` is the ApplicationContext
- Returns `{ statusCode, body, headers }` in Lambda response format
- Config reads from `process.env` (Lambda environment variables, which source from SSM/Secrets Manager)
- JSON body auto-parsed from `event.body`
- Path parameters, query parameters, and headers accessible from the event
- Error handling: unhandled errors → 500 with JSON error body
- Imperative `routes(router)` pattern as alternative

## Proof Level

- This slice proves: contract + integration
- Real Lambda runtime required: no (tests invoke the handler function directly)
- Human/UAT required: no

## Verification

- `npm test -w packages/boot-lambda` — all adapter and controller tests pass
- Tests cover: cold-start boot, warm reuse, route matching, DI resolution, config from env, error handling, missing routes (404), both controller patterns, JSDBC integration

## Tasks

- [ ] **T01: Lambda adapter core + route dispatch** `est:45m`
- [ ] **T02: Integration test with JSDBC** `est:30m`

## Design Notes

### Lambda vs Express/Fastify

| Concern | Express/Fastify | Lambda |
|---|---|---|
| Lifecycle | Long-running server | Per-invocation, cold/warm starts |
| Boot | `init()` creates app, `run()` listens | `bootstrap()` on first invoke |
| Routing | Framework router | Manual routeKey dispatch |
| Request shape | `req`/`request` object | API Gateway event |
| Response shape | `res.json()` / return | `{ statusCode, body, headers }` |
| Config | Files, env, CDI config | `process.env` → CDI config |
| Port/Host | Config-driven | N/A |

### Config / Secrets Strategy

Lambda environment variables map naturally to the existing `EnvPropertySource` in `@alt-javascript/config`. When the CDI context boots:
1. `process.env` values are already available (set via Lambda console, SAM template, SSM references)
2. `EnvPropertySource` reads `JSDBC_URL` as `jsdbc.url`, `SERVER_CORS_ORIGIN` as `server.cors.origin`, etc.
3. For secrets: AWS Secrets Manager values injected as env vars by Lambda's native integration (`AWS_SECRET_*` references in SAM/CDK)
4. No special handling needed — boot's config system already supports env-to-config mapping

### Event Shape (API Gateway HTTP API v2)

```javascript
{
  routeKey: 'GET /todos/{id}',
  pathParameters: { id: '123' },
  queryStringParameters: { page: '1' },
  headers: { 'content-type': 'application/json' },
  body: '{"title":"Buy milk"}',  // string, needs JSON.parse
  isBase64Encoded: false,
  requestContext: { http: { method: 'GET', path: '/todos/123' } }
}
```
