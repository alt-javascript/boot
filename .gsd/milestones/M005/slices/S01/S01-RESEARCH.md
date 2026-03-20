# M005 Research — JavaScript Database Landscape & JSDBC Architecture

## 1. Current State: No JDBC Equivalent in JavaScript

Your observation from a few years ago still holds. JavaScript has **no standardized database access API** comparable to JDBC. Every database has bespoke drivers with incompatible APIs:

| Database | Node.js Driver | API Style | Pure JS? |
|---|---|---|---|
| PostgreSQL | `pg` (node-postgres) | Callback/Promise, `client.query(sql, params)` | Yes |
| PostgreSQL | `postgres` (postgres.js) | Tagged template literals | Yes |
| MySQL/MariaDB | `mysql2` | Callback/Promise, `connection.query(sql, params)` | Yes |
| SQL Server | `tedious` | Event-based TDS protocol | Yes |
| SQL Server | `mssql` | Promise wrapper over tedious | Yes (wraps tedious) |
| SQLite | `better-sqlite3` | Synchronous, `db.prepare(sql).all()` | No (native C++) |
| SQLite | `sql.js` | Sync API, SQLite compiled to Wasm | Yes (Wasm) |
| SQLite | `@sqlite.org/sqlite-wasm` | Official SQLite Wasm build, ES Module | Yes (Wasm) |

### The "JDBC for Node" Attempts

Existing "JDBC in JS" packages (`jdbc`, `node-jdbc-driver`, `node-any-jdbc`) all bridge to **actual Java JDBC** via a JVM process. They require JDK 1.8+, `.jar` files, and `node-java` native bindings. Completely unsuitable — heavy, fragile, not isomorphic.

**There is no pure-JS JDBC-like facade.** This is the gap.

## 2. Query Builders & ORMs (Not What We Want, But Instructive)

The JS ecosystem solved the "multi-database" problem at a higher abstraction level:

| Library | Approach | Databases | Notes |
|---|---|---|---|
| **Knex.js** | Query builder | pg, mysql, sqlite3, mssql, oracledb | Mature (2012), pure JS, has a **dialect system** and **connection pooling** (via tarn.js). Closest thing to a JDBC-level abstraction. |
| **Kysely** | Type-safe query builder | pg, mysql, sqlite | TS-focused, dialect/driver plugin system |
| **Drizzle** | ORM + query builder | pg, mysql, sqlite | TS-first, schema-first |
| **Sequelize** | Full ORM | pg, mysql, sqlite, mssql | Heavy, decorator-based |
| **Prisma** | Schema-first ORM | pg, mysql, sqlite, mongodb, cockroachdb | Rust engine, not embeddable |
| **MikroORM** | Data Mapper ORM | pg, mysql, sqlite, mssql, mongodb | TS decorators |

**Key insight from Knex:** It already has the concept we want — a `client` abstraction that normalizes query execution across databases. But it's a *query builder*, not a *connection/statement/resultset* facade. We want the layer below Knex.

## 3. Browser SQL: It's Real Now

### sql.js (13.5k stars)
- SQLite compiled to WebAssembly via Emscripten
- In-memory by default; can serialize/deserialize full DB files
- Synchronous SQL execution after async init
- Works in `<script type="module">`
- ~1.5MB Wasm payload

### @sqlite.org/sqlite-wasm (Official)
- Official SQLite project's Wasm build
- ES Module distribution on npm
- OPFS (Origin Private File System) persistence in Chrome
- Worker-based API for non-blocking

### Persistence Options
- **In-memory only** — page refresh wipes (sql.js default)
- **IndexedDB** — wa-sqlite, absurd-sql (experimental)
- **OPFS** — Chrome 102+, official SQLite Wasm (best option, ~native perf)
- **localStorage** — tiny DBs only (5MB limit)

**Bottom line:** Isomorphic SQL in the browser is viable. sql.js is the pragmatic choice for broad compatibility. The JSDBC browser driver wraps sql.js.

## 4. Proposed JSDBC Architecture

### Layer Model

```
┌─────────────────────────────────────────────┐
│  JdbcTemplate / NamedParameterJdbcTemplate   │  ← Spring-like API
├─────────────────────────────────────────────┤
│  DataSource (connection factory + pooling)    │  ← Abstract interface
├─────────────────────────────────────────────┤
│  Connection / Statement / ResultSet          │  ← JSDBC facade (core)
├─────────────────────────────────────────────┤
│  Driver interface                            │  ← Pluggable
├──────┬──────┬──────┬──────┬─────────────────┤
│ pg   │mysql2│tedious│sql.js│better-sqlite3   │  ← Native JS drivers
└──────┴──────┴──────┴──────┴─────────────────┘
```

### Core Interfaces (jsdbc-core)

```javascript
// Driver — creates connections
class Driver {
  acceptsURL(url) {}        // 'jsdbc:postgresql://...'
  connect(url, properties) {} // → Connection
}

// Connection — session to database
class Connection {
  prepareStatement(sql) {}   // → PreparedStatement
  createStatement() {}       // → Statement
  setAutoCommit(flag) {}
  commit() {}
  rollback() {}
  close() {}
  getMetaData() {}           // → DatabaseMetaData
}

// Statement — executes SQL
class Statement {
  executeQuery(sql) {}       // → ResultSet
  executeUpdate(sql) {}      // → updateCount
  execute(sql) {}            // → boolean (hasResultSet)
  close() {}
}

// PreparedStatement — parameterized SQL
class PreparedStatement extends Statement {
  setString(index, value) {}
  setInt(index, value) {}
  setParameter(index, value) {} // JS-idiomatic, auto-detect type
  executeQuery() {}          // → ResultSet
  executeUpdate() {}         // → updateCount
}

// ResultSet — query results
class ResultSet {
  next() {}                  // → boolean
  getString(columnNameOrIndex) {}
  getInt(columnNameOrIndex) {}
  getObject(columnNameOrIndex) {} // JS-idiomatic
  getRow() {}                // → plain object {col1: val1, ...}
  getRows() {}               // → array of objects (convenience)
  close() {}
}

// DataSource — connection factory
class DataSource {
  getConnection() {}         // → Connection
}

// DriverManager — registry
class DriverManager {
  static registerDriver(driver) {}
  static getConnection(url, props) {} // → Connection
}
```

### Driver Packages

| Package | Wraps | URL Scheme | Browser? |
|---|---|---|---|
| `@alt-javascript/jsdbc-core` | — | — | ✅ |
| `@alt-javascript/jsdbc-sqlite` | `better-sqlite3` | `jsdbc:sqlite:path` | ❌ |
| `@alt-javascript/jsdbc-sqljs` | `sql.js` | `jsdbc:sqljs:memory` | ✅ |
| `@alt-javascript/jsdbc-pg` | `pg` | `jsdbc:postgresql://host/db` | ❌ |
| `@alt-javascript/jsdbc-mssql` | `tedious`/`mssql` | `jsdbc:sqlserver://host/db` | ❌ |
| `@alt-javascript/jsdbc-mysql` | `mysql2` | `jsdbc:mysql://host/db` | ❌ |

### JdbcTemplate (jsdbc-template)

```javascript
class JdbcTemplate {
  constructor(dataSource) {}

  // Query
  queryForObject(sql, params, rowMapper) {}  // → single object
  queryForList(sql, params, rowMapper) {}    // → array
  queryForMap(sql, params) {}                // → {col: val}

  // Update
  update(sql, params) {}                      // → updateCount
  batchUpdate(sql, paramsArray) {}            // → int[]

  // Execute
  execute(sql) {}                             // → void (DDL)

  // Transaction
  executeInTransaction(callback) {}           // callback(connection)
}

class NamedParameterJdbcTemplate extends JdbcTemplate {
  // sql uses :paramName syntax
  queryForObject(sql, paramMap, rowMapper) {}
}

// RowMapper: (resultSet, rowNum) → object
// ResultSetExtractor: (resultSet) → result
```

## 5. Async vs Sync Decision

**JDBC is synchronous. JavaScript is async.** This is the fundamental tension.

| Option | Pros | Cons |
|---|---|---|
| **All-async (Promise)** | Natural JS, works with pg/mysql2/tedious | Different from JDBC's sync model |
| **Sync where possible** | Matches JDBC, works with better-sqlite3 | pg/mysql2/tedious are inherently async |
| **Dual API** | Maximum flexibility | Complexity, maintenance burden |

**Recommendation: All-async.** Every method returns a Promise. This is idiomatic JavaScript, works with all underlying drivers, and plays well with `async/await`. The JdbcTemplate API reads almost identically to Spring's despite being async:

```javascript
// Spring Java
User user = jdbcTemplate.queryForObject("SELECT * FROM users WHERE id = ?", new Object[]{1}, userMapper);

// JSDBC JavaScript (async)
const user = await jdbcTemplate.queryForObject('SELECT * FROM users WHERE id = ?', [1], userMapper);
```

The only visible difference is `await`.

## 6. Monorepo Structure

```
jsdbc/
  package.json              (npm workspaces)
  packages/
    core/                   (interfaces, DriverManager, DataSource, ResultSet)
    template/               (JdbcTemplate, NamedParameterJdbcTemplate)
    sqlite/                 (better-sqlite3 driver — Node.js)
    sqljs/                  (sql.js driver — isomorphic)
    pg/                     (PostgreSQL driver)
    mssql/                  (SQL Server driver)
    mysql/                  (MySQL/MariaDB driver)
    test-support/           (EmbeddedDatabase, in-memory helpers)
  docs/
  decisions/
```

## 7. Integration with @alt-javascript/boot

In the boot monorepo, a new `@alt-javascript/data` package:

```javascript
// Auto-configured DataSource from config
// config/default.json:
// { "datasource": { "url": "jsdbc:postgresql://localhost/mydb", "username": "...", "password": "..." } }

// Registers as 'dataSource' and 'jdbcTemplate' singletons in ApplicationContext
class DataSourceAutoConfiguration {
  static __component = { scope: 'singleton', condition: conditionalOnProperty('datasource.url') };
}
```

## 8. Key Design Decisions to Make

| Decision | Options | Lean |
|---|---|---|
| Async model | All-async / sync-where-possible / dual | All-async |
| URL scheme | JDBC-style `jsdbc:subprotocol:` / config object only | JDBC-style URLs + config objects |
| Connection pooling | Built-in / delegate to drivers / use tarn.js | Use tarn.js (proven, Knex uses it) |
| Transactions | Template-method / decorator / programmatic | Template-method (`executeInTransaction`) |
| Browser driver | sql.js / @sqlite.org/sqlite-wasm | sql.js (broader compat, simpler API) |
| Named params | `:name` / `$name` / `@name` | `:name` (matches Spring) |
| Result mapping | Row-at-a-time / full-result / both | Both (RowMapper + ResultSetExtractor) |

## 9. What We Can Reuse from Ecosystem

| What | From | How |
|---|---|---|
| PostgreSQL protocol | `pg` (node-postgres) | Wrap as JSDBC Driver |
| MySQL protocol | `mysql2` | Wrap as JSDBC Driver |
| TDS protocol (SQL Server) | `tedious` via `mssql` | Wrap as JSDBC Driver |
| SQLite (Node) | `better-sqlite3` | Wrap as JSDBC Driver |
| SQLite (Browser) | `sql.js` | Wrap as JSDBC Driver |
| Connection pooling | `tarn.js` | Use in DataSource |
| Named param parsing | Custom (~50 lines) | Build (trivial) |

We're writing ~200-300 lines of facade + adapter per driver. The heavy lifting (protocol, parsing, auth) stays in the existing battle-tested packages.

## 10. What Must Be Idiosyncratic

1. **The JSDBC facade itself** — no JS equivalent exists
2. **URL-based driver resolution** — `DriverManager.getConnection('jsdbc:postgresql://...')` — novel for JS
3. **ResultSet iteration** — Java's `while(rs.next())` pattern, adapted to async with `getRows()` convenience
4. **Browser SQL via same API** — write code against JdbcTemplate, swap driver, runs in browser
