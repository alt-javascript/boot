# M005 Context — JSDBC: Spring-Inspired Database Access for JavaScript

## Vision

A new monorepo (`jsdbc`) that brings JDBC's conceptual model to the JavaScript ecosystem — a unified facade for SQL database access with pluggable drivers, plus a Spring JdbcTemplate-equivalent that integrates with the `@alt-javascript/boot` IoC container. Isomorphic: runs SQL storage semantics in Node.js and the browser.

## Goals

1. **Research** the JS database driver landscape and identify reusable building blocks
2. **Design** a JSDBC facade (Connection, Statement, ResultSet, Driver, DataSource, DriverManager)
3. **Implement** driver packages for SQLite, PostgreSQL, SQL Server (and in-memory/browser)
4. **Build** a JdbcTemplate-equivalent on top of the facade
5. **Integrate** with `@alt-javascript/boot` for auto-configuration, connection pooling, transaction management

## Constraints

- Pure JavaScript, no TypeScript compile step
- Isomorphic: same JdbcTemplate API in Node.js and browser (sql.js/Wasm for browser SQLite)
- Drivers are separate packages: `@alt-javascript/jsdbc-sqlite`, `@alt-javascript/jsdbc-pg`, etc.
- Must work standalone (no boot dependency) but integrate cleanly when boot is present
- Prefer wrapping existing battle-tested JS driver packages over re-implementing protocol-level code
- v3.0 `@alt-javascript` ecosystem alignment

## Spring JDBC Features to Map

| Spring Feature | Target |
|---|---|
| `DataSource` | Connection factory with pooling |
| `JdbcTemplate` | Template for query/update/batchUpdate with row mappers |
| `NamedParameterJdbcTemplate` | Named `:param` support |
| `RowMapper` | Function mapping ResultSet row → object |
| `ResultSetExtractor` | Function consuming full ResultSet → result |
| `SimpleJdbcInsert` | Metadata-driven insert builder |
| `@Transactional` | Transaction management (programmatic, via template) |
| `DataSourceInitializer` | Schema init on startup |
| `EmbeddedDatabase` | In-memory database for tests |
