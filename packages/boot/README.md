# @alt-javascript/boot

[![Language](https://img.shields.io/badge/language-JavaScript-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![npm version](https://img.shields.io/npm/v/%40alt-javascript%2Fboot)](https://www.npmjs.com/package/@alt-javascript/boot)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml/badge.svg)](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml)

Application bootstrap for the `@alt-javascript` framework. Detects the runtime environment (Node.js or browser), resolves configuration, and initialises the global boot context that logging and other packages depend on.

**Part of the [@alt-javascript](https://github.com/alt-javascript/boot) monorepo.**

## Install

```bash
npm install @alt-javascript/boot
```

## Quick Start

```javascript
import { Boot } from '@alt-javascript/boot';
import { EphemeralConfig } from '@alt-javascript/config';

const config = new EphemeralConfig({
  logging: { level: { ROOT: 'info' } },
});

Boot.boot({ config });
// global.boot.contexts.root is now populated with { config, loggerFactory, loggerCategoryCache, fetch }
```

## API

```javascript
import { Boot, Application, boot, root, test, config } from '@alt-javascript/boot';
```

### Boot

| Method | Description |
|---|---|
| `Boot.boot(context?)` | Bootstrap application — detects config, sets up global context with loggerFactory and config |
| `Boot.test(context?)` | Test bootstrap — uses `CachingLoggerFactory` to suppress log output during tests |
| `Boot.root(name, default?)` | Read a value from the global boot context (`boot.contexts.root`) |
| `Boot.detectConfig(args?)` | Auto-detect config from: explicit argument → `global.config` → `window.config` |

### Application

```javascript
import { Application } from '@alt-javascript/boot';

await Application.run({ config, contexts: [context] });
```

`Application.run()` calls `Boot.boot()`, then dynamically imports `@alt-javascript/cdi/ApplicationContext` to create a full DI container and run its lifecycle.

## Test Fixtures

Use `Boot.test()` in your mocha `--require` file to suppress logging during tests:

```javascript
// test/fixtures/index.js
import { Boot } from '@alt-javascript/boot';
import config from 'config';

Boot.test({ config });
```

## Browser

Browser variants (`Boot-browser.js`, `Application-browser.js`, `index-browser.js`) use `window` instead of `global` and avoid Node-specific APIs. Import via `index-browser.js` or use an import map.

## License

MIT
