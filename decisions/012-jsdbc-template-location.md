# ADR-012: JSDBC Template in Boot Monorepo

- **Status:** Accepted
- **Date:** 2026-03-18
- **Deciders:** Craig Parravicini

## Context

The JSDBC project provides core interfaces and database drivers. The template layer (`JsdbcTemplate`, `NamedParameterJsdbcTemplate`) integrates with CDI for dependency injection, config for connection properties, and the application lifecycle for connection management. This creates a dependency direction question: should the template live in the JSDBC monorepo or the boot/altjs monorepo?

## Decision

The template layer lives in the boot/altjs monorepo as `@alt-javascript/jsdbc-template`. The JSDBC monorepo contains only core interfaces and drivers.

## Consequences

**Positive:**
- Template has direct access to CDI, config, and lifecycle — no circular dependencies
- Auto-configuration (`jsdbcAutoConfiguration()`) is a natural CDI extension
- JSDBC stays focused on its domain: interfaces and driver implementations

**Negative:**
- The JSDBC monorepo alone doesn't provide the full Spring-style template experience
- Users must install from two package families
