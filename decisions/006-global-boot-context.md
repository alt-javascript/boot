# ADR-006: Global Boot Context Pattern

- **Status:** Accepted
- **Date:** 2026-03-18
- **Deciders:** Craig Parravicini

## Context

The framework's logging and config systems need to be accessible from anywhere in the application — including code that doesn't receive the ApplicationContext via dependency injection. Spring handles this with its own static context holders. The question is how to make bootstrap state globally available in JavaScript.

## Decision

`Boot.boot()` writes to `global.boot.contexts.root` (Node) or `window.boot.contexts.root` (browser). This global state holds: config, loggerFactory, loggerCategoryCache, and fetch.

`LoggerFactory.getLogger()` and `ConfigFactory.getConfig()` read from this global state to resolve defaults.

## Consequences

**Positive:**
- Logging works from any module without explicit context passing
- Consistent with how logging frameworks (log4j, SLF4J) work in Java
- Single bootstrap call sets up the entire infrastructure

**Negative:**
- Global mutable state — multiple ApplicationContexts could conflict
- Tests must reset `global.boot = undefined` between cases
- Implicit coupling — modules silently depend on global state existing

**Idiosyncrasy note:** This global state pattern is unusual in the JavaScript ecosystem, where most frameworks pass dependencies explicitly. It's a deliberate trade-off to keep `LoggerFactory.getLogger('category')` as a one-liner anywhere in the codebase.
