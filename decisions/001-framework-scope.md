# ADR-001: Framework Scope — Spring Core Only

- **Status:** Accepted
- **Date:** 2026-03-18
- **Deciders:** Craig Parravicini

## Context

Spring Framework has hundreds of modules: WebMVC, Data, Security, Cloud, Batch, Integration, etc. The `@alt-javascript` framework needed a clear boundary on what to implement.

## Decision

Limit scope to Spring Framework core and Spring Boot core:

- IoC container and dependency injection
- Component lifecycle (init, destroy, start, stop)
- Application events
- Bean post-processing
- Externalized configuration with profiles
- AOP (method interception)
- Conditional bean registration

Exclude: WebMVC, Data/JPA, Security, Cloud, Batch, Messaging, Integration, Actuator.

## Consequences

**Positive:**
- Focused, completable scope
- Each feature fully implemented rather than many features sketched
- Clear message to users about what the framework provides

**Negative:**
- Users wanting web framework features need to pair with Express, Fastify, etc.
- No data access abstractions — users wire their own repositories
