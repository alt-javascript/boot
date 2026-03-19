# ADR-003: Isomorphic Design — Browser + Node from Same Source

- **Status:** Accepted
- **Date:** 2026-03-18
- **Deciders:** Craig Parravicini

## Context

Most JavaScript frameworks are either server-side (Express, NestJS) or client-side (React, Vue). DI frameworks typically target one environment. The ability to use the same IoC code in both environments is unusual but valuable for universal/isomorphic applications.

## Decision

All core modules work in both Node.js and browser ES modules. Browser-specific variants exist only where Node APIs (fs, process) must be avoided.

Design constraints that follow from this:
- Event system uses custom pub/sub, not Node's EventEmitter
- Global state accessed via `getGlobalRef()` (returns `window` or `globalThis`)
- No filesystem scanning — ESM has no classpath
- CDI bundle built as flat ESM importable via `<script type="module">`

## Consequences

**Positive:**
- Same DI container in server and browser — shared component definitions
- No polyfills or compatibility layers needed
- Proves pure JS IoC can work in any JavaScript runtime

**Negative:**
- Some features are Node-only by nature (ProfileConfigLoader, WinstonLogger)
- Browser variants add a small maintenance burden
- Cannot use Node built-ins freely in shared code
