# HTTP Adapters

Connect CDI-managed services to HTTP frameworks. Each adapter bridges the same controller convention to a specific server or serverless platform.

## Controller Convention

Controllers declare routes via a static `__routes` property:

```javascript
class TodoController {
  static __routes = [
    { method: 'get', path: '/todos', handler: 'list' },
    { method: 'post', path: '/todos', handler: 'create' },
    { method: 'get', path: '/todos/:id', handler: 'get' },
    { method: 'put', path: '/todos/:id', handler: 'update' },
    { method: 'delete', path: '/todos/:id', handler: 'remove' },
  ];

  constructor() {
    this.todoService = null; // autowired by CDI
  }

  async list(req) { return this.todoService.findAll(); }
  async create(req) { return this.todoService.create(req.body); }
  async get(req) { return this.todoService.findById(req.params.id); }
  async update(req) { return this.todoService.update(req.params.id, req.body); }
  async remove(req) { return this.todoService.delete(req.params.id); }
}
```

Every handler receives a normalised request object:

```javascript
{ params, query, headers, body, ctx }
```

Return values are sent as JSON responses. Thrown errors produce appropriate HTTP error responses.

## Server Adapters

### Express

```bash
npm install @alt-javascript/boot-express express
```

```javascript
import { expressAutoConfiguration } from '@alt-javascript/boot-express';
import { ApplicationContext, Context, Singleton } from '@alt-javascript/cdi';

const context = new Context([
  ...expressAutoConfiguration(),
  new Singleton(TodoService),
  new Singleton(TodoController),
]);

const appCtx = new ApplicationContext({ contexts: [context], config });
await appCtx.start();
// Express app is listening
```

The CDI context is available as `req.app.locals.ctx` inside Express middleware.

### Fastify

```bash
npm install @alt-javascript/boot-fastify fastify
```

```javascript
import { fastifyAutoConfiguration } from '@alt-javascript/boot-fastify';

const context = new Context([
  ...fastifyAutoConfiguration(),
  new Singleton(TodoService),
  new Singleton(TodoController),
]);
```

Test with `fastify.inject()`. The CDI context is available as `request.ctx`.

### Koa

```bash
npm install @alt-javascript/boot-koa koa
```

```javascript
import { koaAutoConfiguration } from '@alt-javascript/boot-koa';

const context = new Context([
  ...koaAutoConfiguration(),
  new Singleton(TodoService),
  new Singleton(TodoController),
]);
```

Includes a built-in JSON body parser — no `koa-bodyparser` dependency needed. The CDI context is available as `ctx.cdiContext`.

### Hono

```bash
npm install @alt-javascript/boot-hono hono
```

```javascript
import { honoAutoConfiguration } from '@alt-javascript/boot-hono';

const context = new Context([
  ...honoAutoConfiguration(),
  new Singleton(TodoService),
  new Singleton(TodoController),
]);
```

Uses Hono's native routing. Works on any Web Standards runtime (Bun, Deno, Cloudflare Workers, Node.js). Test with `app.request()`.

## Serverless Adapters

Serverless adapters manage their own CDI lifecycle: boot once on cold start, reuse across warm invocations.

### AWS Lambda

```bash
npm install @alt-javascript/boot-lambda
```

```javascript
import { createLambdaHandler } from '@alt-javascript/boot-lambda';

export const handler = createLambdaHandler({
  contexts: [context],
  config,
});
```

Handles API Gateway HTTP API v2 events. Express-style `:param` routes are auto-converted to API Gateway `{param}` format. Config comes from `process.env` — use AWS SSM or Secrets Manager to inject environment variables.

### Cloudflare Workers

```bash
npm install @alt-javascript/boot-cloudflare-worker
```

```javascript
import { createWorkerHandler } from '@alt-javascript/boot-cloudflare-worker';

export default {
  fetch: createWorkerHandler({ contexts: [context], config }),
};
```

Uses Web Standards `Request`/`Response`. Cloudflare `env` bindings (secrets, KV, D1) are available on `request.env` inside controller handlers.

### Azure Functions

```bash
npm install @alt-javascript/boot-azure-function
```

```javascript
import { createAzureFunctionHandler } from '@alt-javascript/boot-azure-function';

const handler = createAzureFunctionHandler({ contexts: [context], config });
app.http('api', { methods: ['GET', 'POST'], route: '{*path}', handler });
```

Returns Azure Functions v4 `HttpResponseInit` format: `{ status, jsonBody, headers }`.

## Same Service Layer, Any Framework

The key design principle: your service layer is framework-agnostic. The same `TodoService` works unchanged across Express, Fastify, Lambda, and every other adapter. Only the thin adapter and controller registration differ.

```
┌─────────────────────────────────────────┐
│           Your Service Layer            │
│  (TodoService, UserService, etc.)       │
│  Framework-agnostic. CDI-managed.       │
├─────────────────────────────────────────┤
│        Controller (with __routes)       │
│  Framework-specific route handlers      │
├──────────┬──────────┬───────────────────┤
│ Express  │ Fastify  │ Lambda │ Hono ... │
│ Adapter  │ Adapter  │ Adapter│ Adapter  │
└──────────┴──────────┴────────┴──────────┘
```
