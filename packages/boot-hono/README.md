# @alt-javascript/boot-hono

[![Language](https://img.shields.io/badge/language-JavaScript-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![npm version](https://img.shields.io/npm/v/%40alt-javascript%2Fboot-hono)](https://www.npmjs.com/package/@alt-javascript/boot-hono)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml/badge.svg)](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml)

Hono adapter for the `@alt-javascript` framework. Bridges CDI-managed controllers to Hono's Web Standards routing.

**Part of the [@alt-javascript](https://github.com/alt-javascript/boot) monorepo.**

## Install

```bash
npm install @alt-javascript/boot-hono hono
```

## Usage

```javascript
import { honoStarter } from '@alt-javascript/boot-hono';

const context = new Context([
  ...honoStarter(),
  new Singleton(TodoController), // has static __routes
  new Singleton(TodoService),
]);
```

Uses Hono's native `app[method](path, handler)` routing. Works on any runtime that supports Web Standards Request/Response (Bun, Deno, Cloudflare Workers, Node.js).

Test with `app.request()`:

```javascript
const response = await app.request('/todos');
const data = await response.json();
```

## License

MIT
