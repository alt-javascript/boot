# Configuration

## Overview

The config package provides hierarchical, profile-aware configuration with multiple source types. Two approaches are available:

1. **node-config integration** (default) — uses the popular `config` npm package for file loading and environment overrides
2. **Spring-aligned property sources** (new in v3) — `ProfileConfigLoader` with `NODE_ACTIVE_PROFILES`, process.env injection, and layered precedence

Both expose the same interface: `has(path)` and `get(path, defaultValue)`.

## EphemeralConfig (Simplest)

For tests or simple cases, use an in-memory config backed by a plain object:

```javascript
import { EphemeralConfig } from '@alt-javascript/config';

const config = new EphemeralConfig({
  db: { host: 'localhost', port: 5432 },
  logging: { level: { ROOT: 'info' } },
});

config.get('db.host');        // 'localhost'
config.get('db.port');        // 5432
config.get('missing', 'def'); // 'def'
config.has('db.host');        // true
```

Supports dot-notation paths and falsy values (0, false, empty string).

## ProfileConfigLoader (Spring-Aligned)

Load config from files with profile-based overriding, environment variable injection, and layered precedence:

```javascript
import { ProfileConfigLoader } from '@alt-javascript/config';

const config = ProfileConfigLoader.load({
  profiles: 'dev,local',  // or reads NODE_ACTIVE_PROFILES from env
});

config.get('server.port');  // from application-local.json, or application-dev.yaml, or application.json
config.get('db.host');      // from process.env.DB_HOST via relaxed binding
```

### Precedence (Highest → Lowest)

| Priority | Source |
|---|---|
| 1 | Programmatic overrides (`options.overrides`) |
| 2 | Environment variables (`process.env`) with relaxed binding |
| 3 | Profile-specific files (last profile wins) |
| 4 | Default application files |
| 5 | Fallback (e.g. node-config) |

### File Discovery

The loader searches `config/` and the current working directory for:

- `application.properties`
- `application.yaml` / `application.yml`
- `application.json`

And for each active profile:

- `application-{profile}.properties`
- `application-{profile}.yaml` / `application-{profile}.yml`
- `application-{profile}.json`

### Environment Variable Binding

Environment variables are available with relaxed binding:

| Environment Variable | Config Path |
|---|---|
| `MY_APP_PORT` | `my.app.port` |
| `DB_HOST` | `db.host` |
| `SPRING__DATASOURCE__URL` | `spring.datasource.url` |

Single underscores become dots. Double underscores also become dots. Everything lowercased.

### NODE_ACTIVE_PROFILES

Set the `NODE_ACTIVE_PROFILES` environment variable (comma-separated) to activate profile-specific config files:

```bash
NODE_ACTIVE_PROFILES=dev,local node app.js
```

This mirrors Spring's `SPRING_PROFILES_ACTIVE`.

## Java Properties Format

The `.properties` file format is fully supported:

```properties
# Database
db.host=localhost
db.port=5432

# Array notation
security.roles[0]=USER
security.roles[1]=ADMIN

# Array of objects
servers[0].host=web1.example.com
servers[0].port=8080
servers[1].host=web2.example.com
servers[1].port=8081
```

Supports: `key=value`, `key:value`, `key value` separators, `#` and `!` comments, `\` line continuation, `\n` `\t` `\r` `\\` escapes, `\uXXXX` unicode, and dotted key → nested object conversion.

## Placeholder Resolution

With `ValueResolvingConfig`, placeholders in config values are resolved:

```json
{
  "app": {
    "name": "MyApp",
    "description": "${app.name} is a Spring Boot application"
  }
}
```

The `${path:default}` syntax references other config values, with an optional default after the colon.

## ConfigFactory

```javascript
import { ConfigFactory } from '@alt-javascript/config';

// Traditional (node-config backed)
const config = ConfigFactory.getConfig();

// Spring-aligned (profile + env + files)
const config = ConfigFactory.loadConfig({ profiles: 'production' });
```

---

## Framework Configuration Keys

The following keys are reserved by the `@alt-javascript` framework and read from your config
at runtime.

| Key | Values | Default | Description |
|---|---|---|---|
| `boot.banner-mode` | `console`, `log`, `off` | `console` | Controls the startup banner. `console` prints to stdout. `log` routes through `@alt-javascript/logger` at `info` level. `off` suppresses it. |
| `logging.level.ROOT` | log level string | `info` | Root log level for `@alt-javascript/logger`. |
| `logging.level.<category>` | log level string | inherits ROOT | Per-category log level override. |

### Example: suppress the banner and set log levels

```javascript
const config = new EphemeralConfig({
  boot: { 'banner-mode': 'off' },
  logging: {
    level: {
      ROOT: 'warn',
      '@myorg/myapp/MyService': 'debug',
    },
  },
});
```

### Example: route the banner through the logger

```javascript
const config = new EphemeralConfig({
  boot: { 'banner-mode': 'log' },
  logging: { level: { ROOT: 'info' } },
});
```
