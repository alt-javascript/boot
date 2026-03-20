# @alt-javascript/boot-express

[![Language](https://img.shields.io/badge/language-JavaScript-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![npm version](https://img.shields.io/npm/v/%40alt-javascript%2Fboot-express)](https://www.npmjs.com/package/@alt-javascript/boot-express)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml/badge.svg)](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml)

Express adapter for the `@alt-javascript` framework. Bridges CDI-managed controllers to Express routes with zero boilerplate.

**Part of the [@alt-javascript](https://github.com/alt-javascript/boot) monorepo.**

## Install

```bash
npm install @alt-javascript/boot-express express
```

## Usage

Define a controller with `__routes` metadata:

```javascript
class TodoController {
  static __routes = [
    { method: 'get', path: '/todos', handler: 'list' },
    { method: 'post', path: '/todos', handler: 'create' },
    { method: 'get', path: '/todos/:id', handler: 'get' },
  ];

  constructor() { this.todoService = null; } // autowired

  async list(req) { return this.todoService.findAll(); }
  async create(req) { return this.todoService.create(req.body); }
  async get(req) { return this.todoService.findById(req.params.id); }
}
```

Auto-configure with CDI:

```javascript
import { expressAutoConfiguration } from '@alt-javascript/boot-express';

const context = new Context([
  ...expressAutoConfiguration(),
  new Singleton(TodoService),
  new Singleton(TodoController),
]);
```

The adapter discovers all beans with `__routes`, binds them to Express, and makes the CDI context available as `req.app.locals.ctx`.

## How It Works

- `ControllerRegistrar` scans CDI components for `__routes` static metadata
- Each route handler receives a normalised request `{ params, query, headers, body, ctx }`
- Return values are sent as JSON responses
- Thrown errors produce appropriate HTTP error responses

## License

MIT
