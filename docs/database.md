# Database Access

CDI-managed database access via `@alt-javascript/jsdbc-template`. Provides Spring-style `JsdbcTemplate` and `NamedParameterJsdbcTemplate` backed by the [JSDBC](https://github.com/alt-javascript/jsdbc) driver layer.

## Install

```bash
npm install @alt-javascript/jsdbc-template @alt-javascript/jsdbc-core @alt-javascript/jsdbc-sqlite
```

Available JSDBC drivers:

| Package | Database | Notes |
|---|---|---|
| `@alt-javascript/jsdbc-sqlite` | SQLite | Wraps better-sqlite3 |
| `@alt-javascript/jsdbc-sqljs` | SQLite (browser) | Wraps sql.js (WebAssembly) |
| `@alt-javascript/jsdbc-pg` | PostgreSQL | Wraps pg |
| `@alt-javascript/jsdbc-mysql` | MySQL / MariaDB | Wraps mysql2 |
| `@alt-javascript/jsdbc-mssql` | SQL Server | Wraps tedious/mssql |
| `@alt-javascript/jsdbc-oracle` | Oracle | Wraps oracledb |

## JsdbcTemplate

```javascript
import { JsdbcTemplate } from '@alt-javascript/jsdbc-template';
import { DataSource } from '@alt-javascript/jsdbc-core';
import '@alt-javascript/jsdbc-sqlite';

const ds = new DataSource({ url: 'jsdbc:sqlite::memory:' });
const template = new JsdbcTemplate(ds);

// DDL
await template.execute('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');

// Insert
await template.update('INSERT INTO users (name) VALUES (?)', ['Craig']);

// Query
const users = await template.queryForList('SELECT * FROM users');
// [{ id: 1, name: 'Craig' }]

// Query single row
const user = await template.queryForObject(
  'SELECT * FROM users WHERE id = ?', [1]
);

// Row mapper
const names = await template.queryForList(
  'SELECT * FROM users',
  [],
  (row) => row.name.toUpperCase(),
);
// ['CRAIG']

// Batch insert
await template.batchUpdate(
  'INSERT INTO users (name) VALUES (?)',
  [['Alice'], ['Bob']],
);

// Transaction
await template.executeInTransaction(async (txTemplate) => {
  await txTemplate.update('INSERT INTO users (name) VALUES (?)', ['Eve']);
  await txTemplate.update('UPDATE users SET name = ? WHERE id = ?', ['Carol', 1]);
});
```

## NamedParameterJsdbcTemplate

Use `:name` parameters instead of positional `?`:

```javascript
import { NamedParameterJsdbcTemplate } from '@alt-javascript/jsdbc-template';

const namedTemplate = new NamedParameterJsdbcTemplate(ds);

await namedTemplate.update(
  'INSERT INTO users (name) VALUES (:name)',
  { name: 'Craig' },
);

const users = await namedTemplate.queryForList(
  'SELECT * FROM users WHERE name = :name',
  { name: 'Craig' },
);
```

## CDI Auto-Configuration

Register a DataSource, JsdbcTemplate, and NamedParameterJsdbcTemplate with a single function call:

```javascript
import { jsdbcAutoConfiguration } from '@alt-javascript/jsdbc-template';
import { ApplicationContext, Context, Singleton } from '@alt-javascript/cdi';

class UserRepository {
  constructor() {
    this.jsdbcTemplate = null; // autowired
  }
  async findAll() {
    return this.jsdbcTemplate.queryForList('SELECT * FROM users');
  }
}

const context = new Context([
  ...jsdbcAutoConfiguration(),
  new Singleton(UserRepository),
]);

const appCtx = new ApplicationContext({ contexts: [context], config });
await appCtx.start();
```

### Configuration

Set these in `application.json` or any config source:

| Key | Description | Default |
|---|---|---|
| `jsdbc.url` | JSDBC connection URL | (required) |
| `jsdbc.username` | Database username | (none) |
| `jsdbc.password` | Database password | (none) |
| `jsdbc.pool.enabled` | Enable connection pooling | `false` |
| `jsdbc.pool.min` | Minimum pool size | `2` |
| `jsdbc.pool.max` | Maximum pool size | `10` |

In-memory URLs (containing `:memory`) automatically use `SingleConnectionDataSource` instead of a pooled connection.

### Profile-Specific Config

```json
{
  "jsdbc": { "url": "jsdbc:pg://prod-db:5432/app" },
  "profiles": {
    "dev": {
      "jsdbc": { "url": "jsdbc:sqlite::memory:" }
    }
  }
}
```

With `NODE_ACTIVE_PROFILES=dev`, the application uses an in-memory SQLite database. In production, it connects to PostgreSQL.
