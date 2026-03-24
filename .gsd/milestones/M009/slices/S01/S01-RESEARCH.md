# M009/S01 Research — jsdbc API Surface

## Summary

`jsdbc` is the project's own npm monorepo at `/Users/craig/src/github/alt-javascript/jsdbc`.
All database access goes through `@alt-javascript/jsdbc-core` abstractions with driver
packages that self-register with `DriverManager` on import.

---

## Package Map

| Package | Role | URL prefix |
|---|---|---|
| `@alt-javascript/jsdbc-core` | Interfaces: `Driver`, `DriverManager`, `Connection`, `Statement`, `PreparedStatement`, `ResultSet`, `DataSource`, `SingleConnectionDataSource`, `PooledDataSource` | — |
| `@alt-javascript/jsdbc-sqljs` | SQLite via sql.js (WASM — runs in browser and Node) | `jsdbc:sqljs:memory` |
| `@alt-javascript/jsdbc-sqlite` | SQLite via better-sqlite3 (Node only, native) | `jsdbc:sqlite:./path.db` |
| `@alt-javascript/jsdbc-pg` | PostgreSQL | `jsdbc:pg://host/db` |
| `@alt-javascript/jsdbc-mysql` | MySQL/MariaDB | `jsdbc:mysql://host/db` |
| `@alt-javascript/jsdbc-mssql` | SQL Server | `jsdbc:mssql://host/db` |
| `@alt-javascript/jsdbc-oracle` | Oracle | `jsdbc:oracle://host/db` |
| `@alt-javascript/jsdbc-template` | `JsdbcTemplate`, `NamedParameterJsdbcTemplate`, `TransactionTemplate`, `ConfiguredDataSource`, `jsdbcAutoConfiguration()` | — |

---

## Core API

### DataSource variants
```js
// File / server databases — new connection per getConnection()
new DataSource({ url, username?, password?, pool? })

// In-memory — same connection every time (sql.js requires this)
new SingleConnectionDataSource({ url })

// Pooled — tarn.js connection pool
new PooledDataSource({ url, pool: { min, max, acquireTimeoutMillis, idleTimeoutMillis } })
```

### Connection
```js
const conn = await ds.getConnection();
const stmt  = await conn.createStatement();      // DDL
const ps    = await conn.prepareStatement(sql);  // DML / queries with ?
await conn.setAutoCommit(false);
await conn.commit();
await conn.rollback();
await conn.close();
```

### PreparedStatement
```js
ps.setParameter(1, value);   // 1-indexed positional binding
const rs = await ps.executeQuery();    // SELECT
const n  = await ps.executeUpdate();   // INSERT/UPDATE/DELETE → row count
await ps.close();
```

### ResultSet
```js
const rows = rs.getRows();   // Array of plain objects (column name → value)
rs.close();
```

---

## jsdbc-template: existing auto-configuration

`jsdbcAutoConfiguration()` already exists in `@alt-javascript/jsdbc-template`. It returns
an array of CDI component definitions:

- `dataSource` — `ConfiguredDataSource` (reads `jsdbc.*` from config via `setApplicationContext`)
- `jsdbcTemplate` — `JsdbcTemplate(dataSource)` 
- `namedParameterJsdbcTemplate` — `NamedParameterJsdbcTemplate(dataSource)`

Config keys:
```json
{
  "jsdbc": {
    "url": "jsdbc:sqljs:memory",
    "username": "",
    "password": "",
    "pool": {
      "enabled": false,
      "min": 0,
      "max": 10,
      "acquireTimeoutMillis": 30000,
      "idleTimeoutMillis": 30000
    }
  }
}
```

`ConfiguredDataSource.init()` auto-selects:
- `PooledDataSource` if `jsdbc.pool.enabled = true`
- `SingleConnectionDataSource` if URL contains `:memory`
- `DataSource` otherwise

`JsdbcTemplate` methods:
- `queryForList(sql, params?, rowMapper?)` → `Array`
- `queryForObject(sql, params?, rowMapper?)` → single row (throws if 0 or >1)
- `queryForMap(sql, params?)` → single row as object
- `update(sql, params?)` → affected row count
- `batchUpdate(sql, paramsArray)` → row count array
- `execute(sql)` → DDL
- `executeInTransaction(callback)` → wraps callback in commit/rollback

---

## Driver self-registration pattern

Importing the driver side-effects `DriverManager` registration:
```js
import '@alt-javascript/jsdbc-sqljs';   // registers "sqljs" prefix
import '@alt-javascript/jsdbc-sqlite';  // registers "sqlite" prefix
```

No explicit `DriverManager.registerDriver()` call needed.

---

## Design Decision for S02

**The work for S02 is:**

1. Create `packages/boot-jsdbc/` — a new `@alt-javascript/boot-jsdbc` package
2. Export `jsdbcTemplateStarter(options)` — mirrors `expressStarter`, `vueStarter`, etc.
3. Internally calls `Boot.boot()` with `jsdbcAutoConfiguration()` merged into the contexts
4. The driver is imported by the user (or detected from `jsdbc.url` prefix) — the starter
   does not import drivers itself (that would couple it to specific DBs)
5. Re-export `JsdbcTemplate`, `NamedParameterJsdbcTemplate`, `ConfiguredDataSource` for
   convenience so users only need `@alt-javascript/boot-jsdbc` + a driver package

**Config required by caller:**
```json
{ "jsdbc": { "url": "jsdbc:sqljs:memory" } }
```

**Usage pattern:**
```js
import '@alt-javascript/jsdbc-sqljs';         // driver self-registers
import { jsdbcTemplateStarter } from '@alt-javascript/boot-jsdbc';

const { applicationContext } = await jsdbcTemplateStarter({
  contexts: [new Context([new Singleton(UserRepository)])],
  config: { jsdbc: { url: 'jsdbc:sqljs:memory' } },
});

const repo = applicationContext.get('userRepository');
```

**What the starter does automatically:**
- Calls `Boot.boot()` with `jsdbcAutoConfiguration()` prepended to user contexts
- `dataSource`, `jsdbcTemplate`, `namedParameterJsdbcTemplate` beans available for autowiring
- Profile/config/logging all wired via normal Boot.boot() lifecycle

**What the starter does NOT do:**
- Import drivers (user responsibility — keeps the package driver-agnostic)
- Run schema migrations (out of scope)
- Manage connection lifecycle beyond what jsdbc-core provides

---

## Test strategy for S02

Use `@alt-javascript/jsdbc-sqljs` (WASM, no native deps) for all unit tests.
In-memory database, no external infrastructure required.

## S01 conclusion: ready to proceed to S02
