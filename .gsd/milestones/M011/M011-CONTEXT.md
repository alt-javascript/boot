# M011 — NoSQL Persistence: `boot-jsnosqlc` + Examples

## Goal

Add NoSQL persistence support to `@alt-javascript/boot` via a CDI starter for
`@alt-javascript/jsnosqlc` (the JDBC-inspired unified NoSQL access layer).

NoSQL is more native than SQL — `Collection` is already the high-level API.
No template layer is warranted. The starter auto-configures a `client` bean
(analogous to `dataSource`) and the caller uses `client.getCollection()` directly.

## Scope

| # | Slice | Deliverable |
|---|---|---|
| S01 | `boot-jsnosqlc` starter | CDI auto-configuration package |
| S02 | `example-5-5-persistence-nosql` | Single-datasource NoSQL example |
| S03 | `example-5-6-persistence-nosql-multidb` | Multi-datasource NoSQL example |

## Constraints

- `@alt-javascript/jsnosqlc-memory` is the test/CI driver (no native deps)
- `*Starter` naming convention throughout
- Config prefix `boot.nosql.*` (analogous to `boot.datasource.*`)
- Driver-agnostic — starter does not import any driver; caller imports driver on import
- No template layer — `Collection` API is high-level enough
- `client` CDI bean exposes `getCollection(name)` directly
- Multi-datasource via `NoSqlClientBuilder` (mirrors `DataSourceBuilder`)
- Tests must use `jsnosqlc:memory:` URL — zero native deps, CI-safe
- Test suite must stay green at every commit

## Key Decisions

- `boot.nosql.url` as the required config key (analogous to `boot.datasource.url`)
- `ClientDataSource` wrapped in `ConfiguredClientDataSource` CDI bean (manages lifecycle)
- `client` bean is the `Client` instance (not `ClientDataSource`) — callers get collections directly
- `NoSqlClientBuilder` for secondary datasources (named beans)
- `managedClient` / `managedClientTags` pattern for lifecycle (client.close() on context stop)
- No `SchemaInitializer` equivalent — NoSQL is schema-free

## Out of Scope

- Flyway equivalent for NoSQL (schema-free by design)
- Specific cloud driver integration tests (MongoDB, DynamoDB, etc.)
