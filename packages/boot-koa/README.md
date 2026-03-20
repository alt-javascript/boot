# @alt-javascript/boot-koa

[![Language](https://img.shields.io/badge/language-JavaScript-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![npm version](https://img.shields.io/npm/v/%40alt-javascript%2Fboot-koa)](https://www.npmjs.com/package/@alt-javascript/boot-koa)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml/badge.svg)](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml)

Koa adapter for the `@alt-javascript` framework. Bridges CDI-managed controllers to Koa routes with a built-in JSON body parser.

**Part of the [@alt-javascript](https://github.com/alt-javascript/boot) monorepo.**

## Install

```bash
npm install @alt-javascript/boot-koa koa
```

## Usage

```javascript
import { koaAutoConfiguration } from '@alt-javascript/boot-koa';

const context = new Context([
  ...koaAutoConfiguration(),
  new Singleton(TodoController), // has static __routes
  new Singleton(TodoService),
]);
```

The adapter includes a built-in JSON body parser — no need for `koa-bodyparser`. The CDI context is available as `ctx.cdiContext` in Koa middleware.

## License

MIT
