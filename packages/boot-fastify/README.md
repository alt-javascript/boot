# @alt-javascript/boot-fastify

[![Language](https://img.shields.io/badge/language-JavaScript-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![npm version](https://img.shields.io/npm/v/%40alt-javascript%2Fboot-fastify)](https://www.npmjs.com/package/@alt-javascript/boot-fastify)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml/badge.svg)](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml)

Fastify adapter for the `@alt-javascript` framework. Bridges CDI-managed controllers to Fastify routes.

**Part of the [@alt-javascript](https://github.com/alt-javascript/boot) monorepo.**

## Install

```bash
npm install @alt-javascript/boot-fastify fastify
```

## Usage

```javascript
import { fastifyStarter } from '@alt-javascript/boot-fastify';

const context = new Context([
  ...fastifyStarter(),
  new Singleton(TodoController), // has static __routes
  new Singleton(TodoService),
]);
```

Controllers use the same `__routes` convention as all other adapters. The CDI context is available as `request.ctx` in Fastify request handlers.

Test with `fastify.inject()`:

```javascript
const response = await fastify.inject({ method: 'GET', url: '/todos' });
```

## License

MIT
