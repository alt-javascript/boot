# ADR-010: Spring-Aligned Property Sources with NODE_ACTIVE_PROFILES

- **Status:** Accepted
- **Date:** 2026-03-18
- **Deciders:** Craig Parravicini

## Context

The original config package delegated to node-config for file loading and environment overrides. This works but doesn't follow Spring's layered property source model. A closer alignment would make the framework more accessible to Spring developers and support features like .properties files and explicit profile activation.

## Decision

Implement a `ProfileConfigLoader` with Spring Boot's property source precedence:

1. Programmatic overrides (highest)
2. `process.env` with relaxed binding (`MY_APP_PORT` → `my.app.port`)
3. Profile-specific files: `application-{profile}.{json,yaml,properties}`
4. Default files: `application.{json,yaml,properties}`
5. Fallback / node-config (lowest)

`NODE_ACTIVE_PROFILES` environment variable (comma-separated) selects active profiles — mirrors `SPRING_PROFILES_ACTIVE`.

node-config remains as an optional fallback, not replaced.

## Consequences

**Positive:**
- Spring developers recognise the configuration model immediately
- .properties file format supported (including array and nested object notation)
- Environment variables accessible via relaxed binding
- Profile-based overriding without node-config's NODE_ENV mechanism

**Negative:**
- js-yaml added as a dependency (for YAML file support)
- Two config mechanisms exist (node-config and ProfileConfigLoader) — could confuse users
- Node.js only — ProfileConfigLoader uses fs/path (browser uses EphemeralConfig instead)
