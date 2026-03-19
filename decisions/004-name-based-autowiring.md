# ADR-004: Name-Based Autowiring (Not Type-Based)

- **Status:** Accepted
- **Date:** 2026-03-18
- **Deciders:** Craig Parravicini

## Context

Spring resolves `@Autowired` dependencies by type — the container looks for a bean whose class matches the field's declared type. JavaScript has no static type system, so type-based resolution isn't possible.

## Decision

Autowiring matches component **names** to instance **property names**. A singleton's property initialised to `null` is injected if a component with the same name exists in the context.

```javascript
class OrderService {
  constructor() {
    this.orderRepository = null; // injected if 'orderRepository' exists
  }
}
```

The property name is the qualifier. The class name (lowercased first letter) is the default component name.

## Consequences

**Positive:**
- Works without types, annotations, or metadata
- Simple mental model — name your properties after the components they should receive
- No ambiguity resolution needed (unlike Spring's `@Qualifier`)

**Negative:**
- Property names are coupling — renaming a component requires updating all consumers
- Implicit — a null property might be *intentionally* null, not meant for injection
- No interface-based wiring — you can't wire "any bean implementing Cacheable"

**Idiosyncrasy note:** This null-property matching is the framework's most distinctive (and most surprising) pattern for developers coming from other DI frameworks. The `'Autowired'` string marker exists as an opt-in explicit alternative.
