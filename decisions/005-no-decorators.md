# ADR-005: No Decorators — Convention and Static Metadata

- **Status:** Accepted (revisable when Stage 4 decorators ship in engines)
- **Date:** 2026-03-18
- **Deciders:** Craig Parravicini

## Context

Spring uses annotations (`@Component`, `@Autowired`, `@PostConstruct`) for component metadata. JavaScript's TC39 Stage 3 decorators exist as a proposal, but as of Node 24, `Symbol.metadata` is `undefined` and no major engine ships native decorators. Using decorators would require Babel or TypeScript — violating the pure JS constraint.

## Decision

Use three alternative mechanisms instead of decorators:

1. **Constructor helper classes**: `new Singleton(MyClass)` instead of `@Component`
2. **Static metadata**: `static __component = { scope: 'singleton' }` on classes
3. **Convention methods**: `init()`, `destroy()`, `onApplicationEvent()`, `setApplicationContext()`

## Consequences

**Positive:**
- Works today in any JavaScript engine
- No build step or transpiler
- Metadata is inspectable at runtime (it's just properties and methods)

**Negative:**
- Less ergonomic than `@Component` / `@Autowired`
- More boilerplate for component registration
- Unfamiliar pattern for developers used to annotation-based DI

**Risks:**
- If decorators ship natively, the framework should offer decorator alternatives while keeping the current mechanisms as the primary API
