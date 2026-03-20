# ADR-013: HTTP Adapter Pattern — Complement, Don't Replace

- **Status:** Accepted
- **Date:** 2026-03-18
- **Deciders:** Craig Parravicini

## Context

The framework needed a web layer. Two approaches were considered:

1. Build a full HTTP framework (like NestJS) that replaces Express/Fastify
2. Build thin adapters that bridge CDI services into existing frameworks

## Decision

Thin adapter bridges. Each adapter complements a specific HTTP framework — Express, Fastify, Koa, Hono, Lambda, Cloudflare Workers, Azure Functions. The adapter handles controller registration and context propagation. Everything else uses the framework's native capabilities.

## Consequences

**Positive:**
- Users keep the framework they know — Express middleware, Fastify plugins, Koa context all work normally
- Adapters are small (each is a single file with a registrar)
- The service layer is genuinely framework-agnostic — swap Express for Fastify by changing one import
- No framework lock-in

**Negative:**
- Each adapter must be maintained separately
- Controller handlers receive a normalised request, not the raw framework request (slight abstraction cost)
- Framework-specific features (Fastify schemas, Express error middleware) require stepping outside the adapter
