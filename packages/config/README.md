# @alt-javascript/config

[![Language](https://img.shields.io/badge/language-JavaScript-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![npm version](https://img.shields.io/npm/v/%40alt-javascript%2Fconfig)](https://www.npmjs.com/package/@alt-javascript/config)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml/badge.svg)](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml)

Hierarchical, profile-aware configuration for the `@alt-javascript` framework. Supports JSON, YAML, and Java `.properties` files, environment variable binding, placeholder resolution, and layered property sources with Spring Boot-aligned precedence.

**Part of the [@alt-javascript](https://github.com/alt-javascript/boot) monorepo.**

## Install

```bash
npm install @alt-javascript/config
```

## Quick Start

### In-Memory Config 

```javascript
import { EphemeralConfig } from '@alt-javascript/config';
import { ConfigFactory } from '@alt-javascript/config';

// simple config (basic lookup)
const config = new EphemeralConfig({
  db: { host: 'localhost', port: 5432 },
  logging: { level: { ROOT: 'info' } }, 
  secret: 'ENC(Ho8XdYf6/r+FdJ/ZC55BBA==)',
});

config.get('db.host');        // 'localhost'
config.get('db.port');        // 5432
config.get('missing', 'def'); // 'def'
config.get('secret');         // 'ENC(Ho8XdYf6/r+FdJ/ZC55BBA==)'
config.has('db.host');        // true

// wrap for extended features, placeholder resolution, encrypted properties, etc 
const extended = ConfigFactory.getConfig(config);

config.get('secret');         // 'secret'

```

### Profile-Based Config (Spring-Aligned)

```javascript
// Reads NODE_ACTIVE_PROFILES from env, discovers config files
import  { config } from '@alt-javascript/config' ;

config.get('server.port');  // from application-{profile}.json or process.env.SERVER_PORT
```

### node-config Integration (Traditional)

```javascript
//  node-config based discovery and formats
import nodeconfig from 'config';
import { ConfigFactory } from '@alt-javascript/config';

// enhance node-config, with alt features
const config = ConfigFactory.getConfig(nodeconfig); 
```

## Property Source Precedence

When using `ProfileConfigLoader`, sources are checked in this order (highest priority first):

| Priority | Source |
|---|---|
| 1 | Programmatic overrides |
| 2 | Environment variables (`process.env`) with relaxed binding |
| 3 | `.env` files (profile-specific last profile wins, then default) |
| 4 | Profile-specific files (last profile wins) |
| 5 | Default application files |
| 6 | Fallback (node-config) |

Real environment variables (layer 2) always win over `.env` file values (layer 3) — `.env` files never override what the shell or container already provides.

## File Formats

The loader discovers files in `config/` and the current working directory:

- `application.json`, `application.yaml`, `application.yml`, `application.properties`
- `application-{profile}.json`, `application-{profile}.yaml`, etc.

## .env Files

Standard `.env` files are discovered and loaded alongside other config formats:

- `application.env` — default env file, always loaded
- `application-{profile}.env` — profile-specific env file, loaded when the profile is active

```bash
# application.env
DB_HOST=localhost
DB_PORT=5432
export API_KEY=abc123          # export prefix is supported
SECRET="contains spaces"       # double-quoted values
NOTE='literal value'           # single-quoted values
INLINE=value # this is a comment  # inline comments (must be preceded by whitespace)
```

`.env` values are wrapped in `EnvPropertySource`, so they get the same relaxed binding as `process.env`:

| .env key | Config path |
|---|---|
| `DB_HOST` | `db.host` |
| `MY_APP_PORT` | `my.app.port` |
| `SPRING__DATASOURCE__URL` | `spring.datasource.url` |

**Note:** `ProfileConfigLoader` requires Node.js (`fs`, `path`). `.env` file loading is not available in the browser — use `EphemeralConfig` directly for browser targets.

### .properties Format

Full Java `.properties` support:

```properties
db.host=localhost
db.port=5432
security.roles[0]=USER
security.roles[1]=ADMIN
servers[0].host=web1.example.com
servers[0].port=8080
```

Supports `key=value`, `key:value`, `key value` separators, `#`/`!` comments, `\` line continuation, escape sequences, and `\uXXXX` unicode.

## Environment Variable Binding

Environment variables are available with relaxed binding:

| Environment Variable | Config Path |
|---|---|
| `MY_APP_PORT` | `my.app.port` |
| `DB_HOST` | `db.host` |
| `SPRING__DATASOURCE__URL` | `spring.datasource.url` |

## Profiles

Set `NODE_ACTIVE_PROFILES` (comma-separated):

```bash
NODE_ACTIVE_PROFILES=dev,local node app.js
```

## Placeholder Resolution

```javascript
import { ValueResolvingConfig } from '@alt-javascript/config';

// Config values like "${app.name} v${app.version}" resolve to other config paths
// Syntax: ${path} or ${path:default}
```

## All Exports

```javascript
import {
  EphemeralConfig,
  ConfigFactory,
  ProfileConfigLoader,
  PropertySourceChain,
  EnvPropertySource,
  PropertiesParser,
  ValueResolvingConfig,
  DelegatingConfig,
  DelegatingResolver,
  PlaceHolderResolver,
  PlaceHolderSelector,
  PrefixSelector,
  ParenthesisSelector,
  SelectiveResolver,
  Selector,
  URLResolver,
  Resolver,
  JasyptDecryptor,
  config,  // auto-created singleton via ConfigFactory.getConfig()
} from '@alt-javascript/config';
```

## Browser

Use `EphemeralConfig` directly — `ProfileConfigLoader` requires Node.js (`fs`, `path`). A browser-safe `ConfigFactory` is available at `browser/ConfigFactory.js`.

## License

MIT
