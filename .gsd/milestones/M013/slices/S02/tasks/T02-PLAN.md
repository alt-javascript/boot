---
estimated_steps: 9
estimated_files: 8
skills_used: []
---

# T02: Wire middleware into *Starter() functions and boot index

Add the three middleware components to packages/boot/index.js exports.

Also export them individually:
  export { RequestLoggerMiddleware, ErrorHandlerMiddleware, NotFoundMiddleware } from './middleware/index.js';

Update each *Starter() function in boot-express, boot-fastify, boot-hono, boot-koa, boot-lambda, boot-azure-function, boot-cloudflare-worker to include the three middleware components using conditionalOnMissingBean so users can replace any of them.

The starter additions look like:
  { name: 'requestLoggerMiddleware', Reference: RequestLoggerMiddleware, scope: 'singleton', condition: (config, components) => !components.requestLoggerMiddleware },
  { name: 'errorHandlerMiddleware', Reference: ErrorHandlerMiddleware, scope: 'singleton', condition: (config, components) => !components.errorHandlerMiddleware },
  { name: 'notFoundMiddleware', Reference: NotFoundMiddleware, scope: 'singleton', condition: (config, components) => !components.notFoundMiddleware },

For Lambda, CF Workers, and Azure Fn the starters don't currently exist as CDI-wired components (adapters wire themselves differently) — the middleware components still need to be included in the starter arrays so CDI registers them.

## Inputs

- `packages/boot/middleware/index.js`
- `packages/boot-express/index.js`
- `packages/boot-fastify/index.js`
- `packages/boot-hono/index.js`
- `packages/boot-koa/index.js`
- `packages/boot-lambda/index.js`
- `packages/boot-azure-function/index.js`
- `packages/boot-cloudflare-worker/index.js`

## Expected Output

- `packages/boot/index.js (updated)`
- `packages/boot-express/index.js (updated)`
- `packages/boot-fastify/index.js (updated)`
- `packages/boot-hono/index.js (updated)`
- `packages/boot-koa/index.js (updated)`
- `packages/boot-lambda/index.js (updated)`
- `packages/boot-azure-function/index.js (updated)`
- `packages/boot-cloudflare-worker/index.js (updated)`

## Verification

node --input-type=module -e "import { expressStarter } from './packages/boot-express/index.js'; const s = expressStarter(); console.log(s.map(c => c.name).join(', '));"
