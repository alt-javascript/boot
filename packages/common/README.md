# @alt-javascript/common

Shared kernel for the `@alt-javascript` framework. Provides environment detection, global reference resolution, and common utilities used by all other packages.

**Part of the [@alt-javascript](https://github.com/nickg-alt/altjs) monorepo.**

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
