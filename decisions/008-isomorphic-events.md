# ADR-008: Isomorphic Event System (No EventEmitter)

- **Status:** Accepted
- **Date:** 2026-03-18
- **Deciders:** Craig Parravicini

## Context

Spring's ApplicationEvent system uses a synchronous publish/subscribe mechanism. Node.js has EventEmitter, but it's not available in browsers without a polyfill.

## Decision

Custom Map-based pub/sub in `ApplicationEventPublisher`. No dependency on Node's EventEmitter. Supports typed events (subscribe by constructor), lifecycle events (ContextRefreshed, ContextClosed), and convention-based listener detection.

## Consequences

**Positive:**
- Works identically in Node.js and browser
- No polyfill or shim needed
- Simple implementation (~50 lines)
- Typed events match Spring's event model

**Negative:**
- No wildcard subscriptions or event hierarchies
- Synchronous only — no async event handling
- Missing some EventEmitter conveniences (once, removeListener by reference)
