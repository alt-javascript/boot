# Requirements

This file is the explicit capability and coverage contract for the project.

## Validated

### R001 — Spring Framework Core Gap Analysis
- Class: core-capability
- Status: validated
- Description: Map every relevant Spring Framework core feature against existing @alt-javascript capabilities
- Primary owning slice: M001/S01
- Validation: S01-GAP-ANALYSIS.md — 25 Spring features mapped with coverage/gap/feasibility ratings

### R002 — Spring Boot Core Gap Analysis
- Class: core-capability
- Status: validated
- Description: Map Spring Boot core features against existing capabilities
- Primary owning slice: M001/S01
- Validation: Covered in S01 gap analysis alongside framework core

### R003 — Feasibility & Priority Rating for Each Gap
- Class: core-capability
- Status: validated
- Description: Each identified gap has relevance, feasibility, and priority ratings
- Primary owning slice: M001/S01
- Validation: All gaps rated in gap analysis; priorities informed PoC selection

### R004 — Component Auto-Discovery PoC
- Class: core-capability
- Status: validated
- Description: Components self-register via static `__component` class property
- Primary owning slice: M001/S02
- Validation: PoC spike + full implementation in M002/S03. AutoDiscovery.js in CDI package.

### R005 — AOP-Style Method Interception PoC
- Class: core-capability
- Status: validated
- Description: Method-level interception via JS Proxy — before/after/around/afterReturning/afterThrowing
- Primary owning slice: M001/S03
- Validation: PoC spike + full implementation in M002/S04. Aop.js in CDI package.

### R006 — Application Event System PoC
- Class: core-capability
- Status: validated
- Description: Application-level event bus — typed events, ContextRefreshedEvent, ContextClosedEvent
- Primary owning slice: M001/S03
- Validation: PoC spike + full implementation in M002/S02. events/ directory in CDI package.

### R007 — Enhanced Lifecycle Hooks PoC
- Class: core-capability
- Status: validated
- Description: BeanPostProcessor, init/destroy lifecycle, aware interfaces
- Primary owning slice: M001/S03
- Validation: BeanPostProcessor in M002/S02. Full lifecycle in ApplicationContext.

### R008 — Conditional Bean Registration PoC
- Class: core-capability
- Status: validated
- Description: Condition-based registration — conditionalOnProperty, conditionalOnClass, conditionalOnMissingBean, conditionalOnProfile
- Primary owning slice: M001/S03
- Validation: PoC spike + full implementation in M002/S03. Conditions.js in CDI package.

### R009 — Monorepo Evaluation with Prototype
- Class: quality-attribute
- Status: validated
- Description: Consolidated monorepo with npm workspaces and @alt-javascript/common shared kernel
- Primary owning slice: M001/S04
- Validation: Prototype in M001/S04, full migration in M002/S01. 17 packages, coordinated versioning.

### R010 — Prioritized v3.0 Improvement Recommendations
- Class: core-capability
- Status: validated
- Description: Prioritized improvement list grounded in gap analysis and PoC results
- Primary owning slice: M001/S04
- Validation: S04-RECOMMENDATIONS.md — drove M002–M007 milestone sequence

### R013 — v3.0 Implementation of Recommended Improvements
- Class: core-capability
- Status: validated
- Description: Full implementation of gap analysis recommendations
- Primary owning slice: M002/S02, M002/S03, M002/S04
- Validation: M002 complete — 276 tests. BeanPostProcessor, events, auto-discovery, conditions, AOP, constructor injection.

### R014 — Monorepo Migration Execution
- Class: quality-attribute
- Status: validated
- Description: Full migration to npm workspaces monorepo with shared common module
- Primary owning slice: M002/S01
- Validation: M002/S01 complete — 207 tests. 5 packages, CI-ready.

## Active (Constraints)

### R011 — Pure JS Flat ESM Browser Constraint
- Class: constraint
- Status: active
- Description: All solutions must work as flat ESM modules loadable directly in the browser without a build step
- Primary owning slice: all
- Validation: Browser ESM bundles built in M002/S04, browser profile resolver in M007/S01

### R012 — Pure JavaScript Only
- Class: constraint
- Status: active
- Description: No TypeScript compile step — pure JavaScript throughout
- Primary owning slice: all
- Validation: Enforced across all 17 packages — zero TypeScript files

## Traceability

| ID | Class | Status | Primary owner | Proof |
|---|---|---|---|---|
| R001 | core-capability | validated | M001/S01 | S01-GAP-ANALYSIS.md |
| R002 | core-capability | validated | M001/S01 | S01 gap analysis |
| R003 | core-capability | validated | M001/S01 | Gap ratings |
| R004 | core-capability | validated | M001/S02 | AutoDiscovery.js |
| R005 | core-capability | validated | M001/S03 | Aop.js |
| R006 | core-capability | validated | M001/S03 | events/ |
| R007 | core-capability | validated | M001/S03 | BeanPostProcessor.js |
| R008 | core-capability | validated | M001/S03 | Conditions.js |
| R009 | quality-attribute | validated | M001/S04 | npm workspaces monorepo |
| R010 | core-capability | validated | M001/S04 | S04-RECOMMENDATIONS.md |
| R011 | constraint | active | all | Browser ESM bundles |
| R012 | constraint | active | all | Zero TS files |
| R013 | core-capability | validated | M002 | 276 tests |
| R014 | quality-attribute | validated | M002/S01 | Monorepo migration |

## Coverage Summary

- Total requirements: 14
- Validated: 12
- Active constraints: 2
- Unmapped: 0
