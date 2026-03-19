# @alt-javascript/logger

Pluggable, config-driven logging for the `@alt-javascript` framework. Provides a category-based logger with configurable levels, multiple output backends (console, Winston, multi), and a caching variant for test fixtures.

**Part of the [@alt-javascript](https://github.com/nickg-alt/altjs) monorepo.**

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
      'com.myapp.service': 'debug',
    },
  },
});

Boot.boot({ config });

const logger = LoggerFactory.getLogger('com.myapp.service');
logger.debug('Detailed message');  // logged (category level is debug)
logger.info('Normal message');     // logged
logger.warn('Warning message');    // logged
```

## Log Levels

From most to least verbose:

| Level | Value | Method |
|---|---|---|
| `debug` | 5 | `logger.debug(msg, ...args)` |
| `verbose` | 4 | `logger.verbose(msg, ...args)` |
| `info` | 3 | `logger.info(msg, ...args)` |
| `warn` | 2 | `logger.warn(msg, ...args)` |
| `error` | 1 | `logger.error(msg, ...args)` |
| `fatal` | 0 | `logger.fatal(msg, ...args)` |

## Config-Driven Levels

Levels are set in config under `logging.level`:

```json
{
  "logging": {
    "level": {
      "ROOT": "info",
      "com.myapp": "debug",
      "com.myapp.noisy": "warn"
    }
  }
}
```

Category matching is hierarchical — `com.myapp.service` inherits from `com.myapp` if no exact match exists.

## Logger Classes

| Class | Description |
|---|---|
| `LoggerFactory` | Main factory — auto-detects config from global boot context |
| `CachingLoggerFactory` | Factory for tests — captures log output in memory via `CachingConsole` |
| `LoggerCategoryCache` | Caches logger instances by category |
| `ConfigurableLogger` | Logger that reads its level from config |
| `ConsoleLogger` | Writes to console (stdout/stderr) |
| `DelegatingLogger` | Delegates to a provider — base for pluggable backends |
| `MultiLogger` | Fans out to multiple loggers |
| `WinstonLogger` | Winston backend (Node.js only) |
| `WinstonLoggerFactory` | Factory for Winston-backed loggers |
| `JSONFormatter` | Formats log entries as JSON |
| `PlainTextFormatter` | Formats log entries as plain text |
| `CachingConsole` | In-memory console replacement for tests |

## Test Fixtures

Use `Boot.test()` or `CachingLoggerFactory` directly to suppress log output during tests:

```javascript
// test/fixtures/index.js
import { Boot } from '@alt-javascript/boot';
import config from 'config';

Boot.test({ config });
```

This replaces the standard `LoggerFactory` with a `CachingLoggerFactory` that captures output in memory instead of writing to stdout.

## Browser

`ConsoleLogger`, `ConfigurableLogger`, `DelegatingLogger`, `PlainTextFormatter`, `JSONFormatter`, `LoggerFactory`, `Logger`, `LoggerLevel`, and `LoggerCategoryCache` all work in the browser. `WinstonLogger`, `WinstonLoggerFactory`, `MultiLogger`, `CachingLoggerFactory`, and `CachingConsole` are Node.js only.

## License

MIT
