# @alt-javascript/jsdbc-template

[![Language](https://img.shields.io/badge/language-JavaScript-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![npm version](https://img.shields.io/npm/v/%40alt-javascript%2Fjsdbc-template)](https://www.npmjs.com/package/@alt-javascript/jsdbc-template)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml/badge.svg)](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml)

CDI-managed database access for the `@alt-javascript` framework. Wraps [`@alt-javascript/jsdbc-core`](https://github.com/alt-javascript/jsdbc) with Spring-style template patterns and auto-configuration.

**Part of the [@alt-javascript](https://github.com/alt-javascript/boot) monorepo.**

## Install

```bash
npm install @alt-javascript/jsdbc-template @alt-javascript/jsdbc-core @alt-javascript/jsdbc-sqlite
```

## What's Included

| Class | Role |
|---|---|
| `JsdbcTemplate` | Simplifies JSDBC access — `query()`, `update()`, `execute()`, row mapping |
| `NamedParameterJsdbcTemplate` | Named `:param` parameters instead of positional `?` |
| `TransactionTemplate` | Callback-based transaction management |
| `ConfiguredDataSource` | CDI-aware DataSource that reads `jsdbc.*` config |
| `jsdbcAutoConfiguration()` | Auto-configures DataSource + templates from config |

## Usage

### Standalone

```javascript
import { JsdbcTemplate } from '@alt-javascript/jsdbc-template';
import { DataSource } from '@alt-javascript/jsdbc-core';
import '@alt-javascript/jsdbc-sqlite';

const ds = new DataSource({ url: 'jsdbc:sqlite::memory:' });
const template = new JsdbcTemplate(ds);

await template.execute('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
await template.update('INSERT INTO users (name) VALUES (?)', ['Craig']);
const users = await template.query('SELECT * FROM users');
```

### With CDI Auto-Configuration

```javascript
import { jsdbcAutoConfiguration } from '@alt-javascript/jsdbc-template';

const context = new Context([
  ...jsdbcAutoConfiguration(),
  new Singleton(UserRepository),
]);
```

Config (`application.json`):
```json
{ "jsdbc": { "url": "jsdbc:sqlite:./app.db" } }
```

Your `UserRepository` receives a `jsdbcTemplate` or `namedParameterJsdbcTemplate` via autowiring.

## License

MIT
