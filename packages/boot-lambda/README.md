# @alt-javascript/boot-lambda

[![Language](https://img.shields.io/badge/language-JavaScript-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![npm version](https://img.shields.io/npm/v/%40alt-javascript%2Fboot-lambda)](https://www.npmjs.com/package/@alt-javascript/boot-lambda)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml/badge.svg)](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml)

AWS Lambda adapter for the `@alt-javascript` framework. Handles API Gateway HTTP API v2 events with CDI-managed controllers.

**Part of the [@alt-javascript](https://github.com/alt-javascript/boot) monorepo.**

## Install

```bash
npm install @alt-javascript/boot-lambda
```

## Usage

```javascript
import { createLambdaHandler } from '@alt-javascript/boot-lambda';

export const handler = createLambdaHandler({
  contexts: [context],
  config,
});
```

### How It Works

- CDI boots once on the first invocation (cold start)
- Subsequent warm invocations reuse the CDI context via closure
- Express-style `:param` routes are auto-converted to API Gateway `{param}` format
- Config comes from `process.env` via `EnvPropertySource` — use AWS SSM Parameter Store or Secrets Manager to inject env vars

### Controller Convention

Controllers use the same `__routes` metadata as all other adapters:

```javascript
class TodoController {
  static __routes = [
    { method: 'get', path: '/todos', handler: 'list' },
    { method: 'post', path: '/todos', handler: 'create' },
  ];
}
```

## License

MIT
