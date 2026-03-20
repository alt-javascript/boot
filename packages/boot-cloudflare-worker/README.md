# @alt-javascript/boot-cloudflare-worker

[![Language](https://img.shields.io/badge/language-JavaScript-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![npm version](https://img.shields.io/npm/v/%40alt-javascript%2Fboot-cloudflare-worker)](https://www.npmjs.com/package/@alt-javascript/boot-cloudflare-worker)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml/badge.svg)](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml)

Cloudflare Workers adapter for the `@alt-javascript` framework. Handles `fetch(request, env, ctx)` events with CDI-managed controllers.

**Part of the [@alt-javascript](https://github.com/alt-javascript/boot) monorepo.**

## Install

```bash
npm install @alt-javascript/boot-cloudflare-worker
```

## Usage

```javascript
import { createWorkerHandler } from '@alt-javascript/boot-cloudflare-worker';

export default {
  fetch: createWorkerHandler({ contexts: [context], config }),
};
```

### Bindings

Cloudflare `env` bindings (secrets, KV namespaces, D1 databases) are available on `request.env` inside controller handlers.

### Controller Convention

Same `__routes` metadata as all other adapters:

```javascript
class TodoController {
  static __routes = [
    { method: 'get', path: '/todos', handler: 'list' },
  ];

  async list(req) {
    const kv = req.env.MY_KV; // Cloudflare KV binding
    return JSON.parse(await kv.get('todos'));
  }
}
```

## License

MIT
