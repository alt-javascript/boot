# ADR-016: Frontend Adapters — Framework-Native Bridges

- **Status:** Accepted
- **Date:** 2026-03-18
- **Deciders:** Craig Parravicini

## Context

The framework needed to support frontend SPAs. Options considered:

1. Build a custom reactive system that replaces Vue/React/Angular state management
2. Build thin bridges that connect CDI services to each framework's native DI/state mechanism

## Decision

Thin framework-native bridges. Each adapter uses the target framework's own dependency mechanism:

| Framework | Bridge Mechanism |
|---|---|
| Vue 3 | `app.provide()` / `inject()` |
| Alpine.js | `Alpine.store()` |
| React | `React.createContext()` + `useContext()` hooks |
| Angular | `{ provide, useValue }` provider definitions |

The adapters do not depend on the target framework at runtime — they accept it as a parameter or peer dependency. This keeps them testable without a DOM environment.

## Consequences

**Positive:**
- No new patterns for framework users to learn — CDI beans appear where they expect dependencies
- No runtime dependency on the target framework
- Testable with mock framework objects (mock `createApp`, mock `Alpine.store`)
- The service layer stays framework-agnostic

**Negative:**
- Four separate adapter packages to maintain
- Each framework has slightly different semantics for its DI mechanism
- CDI bean reactivity is not automatic — Vue's `reactive()` or React's `useState` must wrap CDI values if reactivity is needed
