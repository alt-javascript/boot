# @alt-javascript/common

[![Language](https://img.shields.io/badge/language-JavaScript-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![npm version](https://img.shields.io/npm/v/%40alt-javascript%2Fcommon)](https://www.npmjs.com/package/@alt-javascript/common)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml/badge.svg)](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml)

Shared kernel for the `@alt-javascript` framework. Provides environment detection, global reference resolution, and common utilities used by all other packages.

**Part of the [@alt-javascript](https://github.com/alt-javascript/boot) monorepo.**

## Install

```bash
npm install @alt-javascript/common
```

## API

```javascript
import { detectBrowser, getGlobalRef, getGlobalRoot, isPlainObject } from '@alt-javascript/common';
```

| Function | Description |
|---|---|
| `detectBrowser()` | Returns `true` if running in a browser (`window` exists) |
| `getGlobalRef()` | Returns `window` (browser) or `globalThis` (Node.js) |
| `getGlobalRoot(key)` | Read from `boot.contexts.root[key]` on the global object |
| `isPlainObject(value)` | Returns `true` for plain objects (not arrays, null, Date, etc.) |

## Usage

```javascript
import { detectBrowser, getGlobalRef } from '@alt-javascript/common';

if (detectBrowser()) {
  console.log('Running in browser');
} else {
  console.log('Running in Node.js');
}

const global = getGlobalRef();
// global === window (browser) or globalThis (Node.js)
```

## Why

Previously, environment detection and global reference logic was duplicated across Boot.js, ApplicationContext.js, ConfigFactory.js, and LoggerFactory.js. This package is the single source of truth.

## License

MIT
