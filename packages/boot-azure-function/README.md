# @alt-javascript/boot-azure-function

[![Language](https://img.shields.io/badge/language-JavaScript-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![npm version](https://img.shields.io/npm/v/%40alt-javascript%2Fboot-azure-function)](https://www.npmjs.com/package/@alt-javascript/boot-azure-function)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml/badge.svg)](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml)

Azure Functions adapter for the `@alt-javascript` framework. Handles Azure Functions v4 HTTP triggers with CDI-managed controllers.

**Part of the [@alt-javascript](https://github.com/alt-javascript/boot) monorepo.**

## Install

```bash
npm install @alt-javascript/boot-azure-function
```

## Usage

```javascript
import { createAzureFunctionHandler } from '@alt-javascript/boot-azure-function';

const handler = createAzureFunctionHandler({ contexts: [context], config });

app.http('api', { methods: ['GET', 'POST'], route: '{*path}', handler });
```

### Response Format

Returns Azure Functions v4 `HttpResponseInit`:

```javascript
{ status: 200, jsonBody: { ... }, headers: { 'Content-Type': 'application/json' } }
```

### Controller Convention

Same `__routes` metadata as all other adapters.

## License

MIT
