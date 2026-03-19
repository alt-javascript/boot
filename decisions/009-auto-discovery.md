# ADR-009: Auto-Discovery via Static Class Property

- **Status:** Accepted (revisable when native decorators ship)
- **Date:** 2026-03-18
- **Deciders:** Craig Parravicini

## Context

Spring scans the classpath for `@Component`-annotated classes. JavaScript ES modules have no classpath — you can't enumerate all loaded modules. An alternative discovery mechanism was needed.

## Decision

Classes opt in to discovery via `static __component`:

```javascript
class UserService {
  static __component = { scope: 'singleton', profiles: ['production'] };
}
```

The `scan()` function accepts an explicit array of classes and reads their `__component` metadata. There is no filesystem scanning.

## Consequences

**Positive:**
- Metadata is co-located with the class — no external registration file
- Works without decorators, annotations, or build tooling
- The `scan([...classes])` API is explicit about what gets scanned
- Metadata is a plain object — inspectable and serializable

**Negative:**
- The consumer must explicitly pass class references to `scan()`
- No automatic discovery — you can't just "put a class on the classpath"
- `__component` is a non-standard property name (underscore prefix is idiosyncratic)

**Idiosyncrasy note:** The double-underscore prefix (`__component`) is deliberately chosen to avoid collision with application properties. It's unusual in JavaScript but clearly signals "framework metadata."
