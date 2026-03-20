# M005 Roadmap — JSDBC: Spring-Inspired Database Access

## Milestone Goal

Research, design, and PoC a JDBC-like database access facade for JavaScript with pluggable drivers and a Spring JdbcTemplate equivalent. Isomorphic — same API in Node.js and browser.

## Slices

- [x] **S01: Research & Architecture** `risk:low` `depends:[]`
  Deep research into JS database driver landscape, existing JDBC-for-JS attempts, query builders, browser SQL options. Produce architecture document with layer model, interface designs, driver mapping, async decisions, and monorepo structure.

- [x] **S02: JSDBC Core + SQLite Driver PoC** `risk:high` `depends:[S01]`
  Implement jsdbc-core interfaces (Driver, Connection, Statement, PreparedStatement, ResultSet, DataSource, DriverManager). Build sqlite driver (better-sqlite3) and sqljs driver (browser). Prove the facade works: same test suite runs against both drivers.

- [x] **S03: JdbcTemplate + NamedParameterJdbcTemplate** `risk:medium` `depends:[S02]`
  Build the template layer: queryForObject, queryForList, update, batchUpdate, execute, executeInTransaction, RowMapper, ResultSetExtractor. Named parameter parsing (`:name` syntax). Test against SQLite.

- [x] **S04: PostgreSQL Driver + Integration Test** `risk:medium` `depends:[S02]`
  PostgreSQL driver wrapping `pg`. Verify JdbcTemplate works identically against pg and sqlite. Connection pooling via tarn.js.

- [ ] **S05: Boot Integration + Auto-Configuration** `risk:medium` `depends:[S03,S04]`
  `@alt-javascript/data` package in boot monorepo. Auto-configure DataSource + JdbcTemplate from config. Conditional registration. EmbeddedDatabase for tests.
