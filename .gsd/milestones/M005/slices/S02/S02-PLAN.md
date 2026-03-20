# S02 Plan — JSDBC Core + SQLite Driver PoC

## Goal
Create the jsdbc monorepo with core interfaces and two SQLite drivers (better-sqlite3 for Node, sql.js for isomorphic). Prove the facade works: same test suite against both drivers.

## Tasks

- [ ] **T01: Monorepo scaffold + core interfaces** `est:1h`
  Create jsdbc monorepo with npm workspaces. Implement core package: Driver, Connection, Statement, PreparedStatement, ResultSet, DataSource, DriverManager. All abstract/base classes with JSDoc.

- [ ] **T02: better-sqlite3 driver** `est:45m`
  Implement SqliteDriver, SqliteConnection, SqliteStatement, SqlitePreparedStatement, SqliteResultSet wrapping better-sqlite3. Register with DriverManager for `jsdbc:sqlite:` URLs.

- [ ] **T03: sql.js driver** `est:45m`
  Implement SqlJsDriver, SqlJsConnection, etc. wrapping sql.js. Register for `jsdbc:sqljs:` URLs. Verify works in Node (browser testing deferred).

- [ ] **T04: Shared test suite** `est:30m`
  Write driver-agnostic tests: create table, insert, select, update, delete, prepared statements, transactions. Run against both drivers via parameterized test setup. Prove API compatibility.
