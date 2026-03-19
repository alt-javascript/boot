# ADR-007: AOP via JavaScript Proxy

- **Status:** Accepted
- **Date:** 2026-03-18
- **Deciders:** Craig Parravicini

## Context

Spring AOP uses dynamic proxies (JDK Proxy for interfaces, CGLIB for classes) to intercept method calls. JavaScript needs an equivalent mechanism that works without bytecode generation.

## Decision

Use JavaScript's built-in `Proxy` object to intercept method calls. The `createProxy(target, aspects)` function wraps a target object with a Proxy that checks each property access — if the property is a function and matches an aspect's pointcut, the call is intercepted.

Five advice types: before, after, afterReturning, afterThrowing, around.

Pointcut matching: exact string, wildcard glob, RegExp, or predicate function.

## Consequences

**Positive:**
- Native JavaScript feature — no library dependency
- Works on any object (not limited to classes)
- Clean separation of cross-cutting concerns
- Same advice types as Spring AOP

**Negative:**
- Performance overhead on every property access (Proxy trap fires for non-method access too)
- Not suitable for hot-path code (use sparingly)
- No annotation-based pointcut expressions — pointcuts are defined programmatically

**Risks:**
- If performance benchmarking shows Proxy overhead is problematic in hot paths, consider a code-generation approach or limiting interception to explicitly proxied beans only
