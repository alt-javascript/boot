# @alt-javascript/logger

[![Language](https://img.shields.io/badge/language-JavaScript-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![npm version](https://img.shields.io/npm/v/%40alt-javascript%2Flogger)](https://www.npmjs.com/package/@alt-javascript/logger)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml/badge.svg)](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml)

Pluggable, config-driven logging for the `@alt-javascript` framework. Provides a category-based logger with configurable levels per category, multiple output backends, and a caching variant for test fixtures.

**Inspired by [SLF4J](https://www.slf4j.org/) + [Logback](https://logback.qos.ch/) — the same `LoggerFactory.getLogger(category)` API used throughout the Spring ecosystem.**

**Part of the [@alt-javascript](https://github.com/alt-javascript/boot) monorepo.**

## Install

```bash
npm install @alt-javascript/logger
```

## Quick Start

```javascript
import { LoggerFactory } from '@alt-javascript/logger';
import { Boot } from '@alt-javascript/boot';
import { EphemeralConfig } from '@alt-javascript/config';

const config = new EphemeralConfig({
  logging: {
    level: {
      ROOT: 'info',
      'com.myapp.service': 'debug',   // category-specific level
    },
  },
});

Boot.boot({ config });

const logger = LoggerFactory.getLogger('com.myapp.service');
logger.debug('Detailed message');  // logged — category level is debug
logger.info('Normal message');     // logged
logger.warn('Warning message');    // logged
logger.verbose('Very detailed');   // not logged — below debug
```

## Log Levels

Levels from most to least verbose: `silly` → `verbose` → `debug` → `info` → `warn` → `error`.

Configure per category hierarchy — `com.myapp` applies to all loggers whose name starts with `com.myapp`:

```json
{
  "logging": {
    "level": {
      "ROOT": "warn",
      "com.myapp": "info",
      "com.myapp.repository": "debug"
    }
  }
}
```

## CDI Autowiring

In CDI components, declare `this.logger = null` and it is autowired automatically:

```javascript
class OrderService {
  constructor() {
    this.logger = null; // autowired — category defaults to the component name
  }

  processOrder(id) {
    this.logger.info(`Processing order ${id}`);
  }
}
```

## Backends

| Backend | How to configure |
|---|---|
| Console (default) | No configuration needed |
| Winston | `Boot.boot({ loggerFactory: new WinstonLoggerFactory(winston) })` |
| Multi | `Boot.boot({ loggerFactory: new MultiLoggerFactory([...]) })` |
| Caching (test) | `Boot.test({ config })` — suppresses output, stores log calls for assertion |

## Test Fixtures

`Boot.test()` installs `CachingLoggerFactory`, which stores log calls without printing them:

```javascript
// test/fixtures/index.js
import { Boot } from '@alt-javascript/boot';
import config from 'config';

Boot.test({ config });
```

## Spring / SLF4J Attribution

| SLF4J / Logback concept | @alt-javascript/logger equivalent |
|---|---|
| `LoggerFactory.getLogger(Class)` | `LoggerFactory.getLogger('category.name')` |
| Logger hierarchy (parent categories) | Category-prefix matching in config |
| `Logger.debug()`, `.info()`, `.warn()`, `.error()` | Same method names |
| Log level configuration in `logback.xml` | `logging.level.*` in config |
| `@Slf4j` field injection (Lombok) | `this.logger = null` CDI autowiring |

## License

MIT
