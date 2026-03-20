# ADR-014: Controller Convention — Static `__routes` Metadata

- **Status:** Accepted
- **Date:** 2026-03-18
- **Deciders:** Craig Parravicini

## Context

Controllers need to declare which HTTP routes they handle. Options considered:

1. Decorator-based annotations (requires transpilation — violates pure JS constraint)
2. External route mapping files (separated from the controller class)
3. Static class property with route metadata
4. Imperative `routes(router)` method

## Decision

Static `__routes` property as the primary convention, with imperative `routes(router)` as an alternative for advanced cases.

```javascript
class TodoController {
  static __routes = [
    { method: 'get', path: '/todos', handler: 'list' },
    { method: 'post', path: '/todos', handler: 'create' },
  ];
}
```

## Consequences

**Positive:**
- Declarative and co-located with the class
- Works in pure JavaScript without decorators or transpilation
- Consistent with `__component` metadata pattern used for auto-discovery
- Easy to scan programmatically (ControllerRegistrar reads the array)
- Same controller works across all adapters

**Negative:**
- Less familiar to developers coming from NestJS's `@Get()` / `@Post()` decorators
- Route metadata is a plain array — no compile-time validation
