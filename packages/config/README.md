# @alt-javascript/config

[![Language](https://img.shields.io/badge/language-JavaScript-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![npm version](https://img.shields.io/npm/v/%40alt-javascript%2Fconfig)](https://www.npmjs.com/package/@alt-javascript/config)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml/badge.svg)](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml)

Hierarchical, profile-aware configuration for the `@alt-javascript` framework. Supports JSON, YAML, Java `.properties`, and `.env` files, environment variable binding, `${placeholder:default}` resolution, and layered property sources — all following [Spring Boot](https://docs.spring.io/spring-boot/reference/features/external-config.html)'s externalized configuration conventions.

**Part of the [@alt-javascript](https://github.com/alt-javascript/boot) monorepo.**

## Install

```bash
npm install @alt-javascript/config
```

## Quick Start

### In-Memory Config

```javascript
import { EphemeralConfig } from '@alt-javascript/config';

const config = new EphemeralConfig({
  db: { host: 'localhost', port: 5432 },
  logging: { level: { ROOT: 'info' } },
});

config.get('db.host');        // 'localhost'
config.get('missing', 'def'); // 'def'
config.has('db.host');        // true
```

### File-Based Config (Spring Boot conventions)

Place `application.json`, `application.yaml`, or `application.properties` in the project root or `config/` directory. Activate profiles via `NODE_ACTIVE_PROFILES=production`:

```bash
NODE_ACTIVE_PROFILES=production node app.js
```

Profile-specific files (`application-production.json`) override the base file. This maps directly to Spring Boot's `spring.profiles.active` and `application-{profile}.properties` conventions.

```javascript
import { ConfigFactory } from '@alt-javascript/config';

const config = ConfigFactory.loadConfig(); // discovers files automatically
config.get('db.url'); // from application-production.json
```

### Environment Variables

Environment variables bind to config keys automatically. `MY_APP_PORT` becomes `my.app.port` and `my_app_port` (relaxed binding, same as Spring Boot):

```javascript
// process.env.MY_APP_PORT = '8080'
config.get('my.app.port'); // '8080'
```

### `.env` File Support

`application.env` and `application-{profile}.env` are loaded automatically by `ProfileConfigLoader`:

```
# application.env
APP_NAME=MyApp
DATABASE_URL=postgres://localhost:5432/mydb
SECRET_KEY="super secret value"
```

### Placeholder Resolution

```javascript
import { ConfigFactory, EphemeralConfig } from '@alt-javascript/config';

const config = ConfigFactory.getConfig(new EphemeralConfig({
  app: { name: 'MyApp', timeout: '30' },
  service: { label: '${app.name} Service' },
}));

config.get('service.label'); // 'MyApp Service'
```

CDI components use placeholder strings in their constructors (equivalent to Spring `@Value`):

```javascript
class MyService {
  constructor() {
    this.appName = '${app.name:DefaultApp}'; // resolved during CDI wiring
    this.timeout = '${app.timeout:60}';
  }
}
```

## Property Sources (Spring Precedence Order)

`ProfileConfigLoader.load()` builds a `PropertySourceChain` following Spring Boot's precedence (highest wins):

1. Programmatic overrides
2. `process.env` (with relaxed binding)
3. Profile-specific `.env` files (`application-{profile}.env`)
4. Default `.env` file (`application.env`)
5. Profile-specific config files (`application-{profile}.{json,yaml,yml,properties}`)
6. Default config files (`application.{json,yaml,yml,properties}`)
7. Fallback config (e.g. node-config)

## API

| Class | Description |
|---|---|
| `EphemeralConfig` | In-memory config from a plain object |
| `ConfigFactory` | Wraps a config with placeholder resolution and encryption support |
| `ProfileConfigLoader` | File-based config with Spring Boot-aligned precedence |
| `PropertySourceChain` | Ordered chain of property sources |
| `EnvPropertySource` | `process.env` with Spring-style relaxed binding |
| `DotEnvParser` | Parses `.env` file format |
| `PropertiesParser` | Parses Java `.properties` file format |

## Spring Attribution

This package deliberately mirrors [Spring Boot's Externalized Configuration](https://docs.spring.io/spring-boot/reference/features/external-config.html):

| Spring Boot concept | @alt-javascript/config equivalent |
|---|---|
| `spring.profiles.active` | `NODE_ACTIVE_PROFILES` |
| `application.properties` / `.yaml` | `application.json` / `.yaml` / `.properties` |
| `application-{profile}.properties` | `application-{profile}.json` / `.yaml` / `.properties` / `.env` |
| `Environment` / `PropertySource` | `PropertySourceChain` / `EnvPropertySource` |
| `@Value("${key:default}")` | Placeholder strings in CDI component constructors |
| Relaxed binding (`my.app.port` ↔ `MY_APP_PORT`) | `EnvPropertySource` relaxed binding |

## License

MIT
