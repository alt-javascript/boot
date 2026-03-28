# M002: M002: v3.0 Implementation

## Vision
Transform the @alt-javascript framework from a basic IoC container into a production-grade DI framework with auto-discovery, AOP, events, conditional beans, and constructor injection — all in pure JavaScript ESM, in a monorepo structure.

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | Monorepo Migration + Common Package | high | — | ✅ | all 268 existing tests pass through npm workspaces with shared @alt-javascript/common; EphemeralConfig falsy bug fixed |
| S02 | BeanPostProcessor + Application Events | high | S01 | ✅ | ApplicationContext fires ContextRefreshedEvent/ContextClosedEvent during lifecycle; custom BeanPostProcessors can intercept bean creation |
| S03 | Auto-Discovery + Conditional Registration | medium | S01 | ✅ | components with static __component are auto-discovered; conditionalOnProperty/MissingBean/Bean filter registration |
| S04 | AOP + Constructor Injection + Integration | medium | S02, S03 | ✅ | AOP proxies applied via BeanPostProcessor; constructor args resolved from context; aware interfaces work; integrated scenario exercises all features together; browser bundles build |
