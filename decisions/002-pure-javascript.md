# ADR-002: Pure JavaScript — No TypeScript

- **Status:** Accepted
- **Date:** 2026-03-18
- **Deciders:** Craig Parravicini

## Context

The JavaScript ecosystem has largely moved to TypeScript for frameworks with DI (InversifyJS, tsyringe, NestJS). TypeScript provides decorators, static types, and metadata reflection that make DI more ergonomic. However, TypeScript requires a build step, and TypeScript decorators are not standard JavaScript.

## Decision

The entire framework is pure JavaScript ES modules. No TypeScript source, no TypeScript compilation step, no dependency on TypeScript features.

## Consequences

**Positive:**
- True isomorphism — the same source files execute in Node.js and `<script type="module">` in browsers
- No build step for consumers — `npm install` and import
- Demonstrates that structured DI is possible without a type system
- Differentiator in an ecosystem where every DI framework requires TypeScript

**Negative:**
- No static type checking — bugs caught at runtime not compile time
- No decorator syntax — must use alternative patterns (constructor classes, static metadata, convention methods)
- JSDoc is the only type documentation mechanism
- Some developers will dismiss the framework for lacking TypeScript support

**This is an ideological choice.** The framework exists specifically to prove that IoC and DI work in pure JavaScript. If you want TypeScript DI, InversifyJS and NestJS are excellent.
