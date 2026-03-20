---
id: S01
parent: M001
milestone: M001
provides:
  - Comprehensive gap analysis: 85 Spring features mapped with coverage/relevance/feasibility/priority ratings
  - Capability inventory of all four @alt-javascript packages
  - Top-7 P1 improvements identified with effort estimates
  - 13 P2 improvements cataloged
  - Cross-cutting observations on code health, global state pattern, monorepo implications
requires:
  - slice: none
    provides: first slice
affects:
  - S02
  - S03
  - S04
key_files:
  - .gsd/milestones/M001/slices/S01/S01-GAP-ANALYSIS.md
  - .gsd/milestones/M001/slices/S01/tasks/T01-SUMMARY.md
key_decisions:
  - "SpEL deferred — low ROI for pure JS"
  - "Web scopes deferred — out of scope for core"
  - "Actuator deferred — domain-specific"
  - "BeanPostProcessor identified as highest-impact architectural gap — enables AOP, validation, logging injection"
patterns_established:
  - "Four-column rating system: coverage/relevance/feasibility/priority"
  - "P1/P2/P3/defer priority tiers"
observability_surfaces:
  - none
drill_down_paths:
  - .gsd/milestones/M001/slices/S01/tasks/T01-SUMMARY.md
  - .gsd/milestones/M001/slices/S01/tasks/T02-SUMMARY.md
  - .gsd/milestones/M001/slices/S01/tasks/T03-SUMMARY.md
duration: 2h
verification_result: passed
completed_at: 2026-03-18T01:45:00Z
---

# S01: Spring Framework & Boot Core Gap Analysis

**85 Spring features mapped — 6 full, 14 partial, 65 none — with 7 P1 and 13 P2 improvements identified for v3.0**

## What Happened

Executed a three-task audit: (T01) deep inventory of all four packages' public APIs, integration points, and code health; (T02) Spring Framework core mapping across 8 feature areas; (T03) Spring Boot core mapping across 6 areas plus final synthesis.

The analysis reveals the framework has solid foundations — singleton/prototype scopes, profiles with negation, property placeholder resolution, config-driven contexts, and flexible factory patterns — but significant gaps in the patterns that make Spring productive: BeanPostProcessor (the enabler for AOP and cross-cutting concerns), application events, auto-discovery/auto-configuration, conditional bean registration, constructor injection, and aware interfaces.

The most impactful finding: BeanPostProcessor is the single feature that unlocks the most downstream capabilities. In Spring, it's the mechanism behind AOP proxying, `@Autowired` processing, validation, and many other features. Adding it to @alt-javascript would be the highest-leverage change.

## Verification

- Gap analysis document exists at `S01-GAP-ANALYSIS.md` with all 85 features rated
- Every feature row has coverage, relevance, feasibility, and priority columns filled
- Source file references provided in T01 inventory for all coverage claims
- Synthesis section includes top-7 P1 and 13 P2 improvements with effort estimates

## Requirements Advanced

- R001 — Spring Framework core gap analysis complete: 57 features mapped across 8 areas
- R002 — Spring Boot core gap analysis complete: 28 features mapped across 6 areas
- R003 — All 85 features have relevance, feasibility, and priority ratings

## Requirements Validated

- None yet — analysis is input to PoC work

## New Requirements Surfaced

- None

## Requirements Invalidated or Re-scoped

- None

## Deviations

T02 and T03 were combined into a single document (S01-GAP-ANALYSIS.md) rather than separate files — the analysis flows naturally as one cohesive document. Separate task summaries maintained for tracking.

## Known Limitations

- Analysis is based on source reading and Spring knowledge, not exhaustive testing of every feature claim
- Some feasibility ratings (especially for AOP Proxy performance) need PoC validation in S03

## Follow-ups

- S02: Component auto-discovery PoC using static class properties or manifest — informed by 2.1.x findings
- S03: BeanPostProcessor, event system, conditional registration, AOP — informed by P1 list
- S04: Monorepo evaluation — informed by cross-cutting observations section

## Files Created/Modified

- `.gsd/milestones/M001/slices/S01/S01-GAP-ANALYSIS.md` — Primary deliverable: 85-feature gap matrix with synthesis
- `.gsd/milestones/M001/slices/S01/tasks/T01-SUMMARY.md` — Capability inventory of four packages
- `.gsd/milestones/M001/slices/S01/tasks/T02-SUMMARY.md` — Spring Framework core mapping summary
- `.gsd/milestones/M001/slices/S01/tasks/T03-SUMMARY.md` — Spring Boot core mapping + synthesis summary

## Forward Intelligence

### What the next slice should know
- BeanPostProcessor is the architectural keystone — S03 should implement this first because AOP proxying, aware interface injection, and validation all depend on it
- Auto-discovery (S02) and conditional registration (S03) are independent features but will compose well: auto-discovered components can have conditions applied
- The `getGlobalRef`/`detectBrowser`/`getGlobalRoot` duplication is in 4 files — any shared kernel extraction should prioritize this

### What's fragile
- Implicit null-matching autowiring — any PoC that adds new context components risks unintended injection into existing beans with matching null properties

### Authoritative diagnostics
- T01 summary has the definitive inventory of every public API across 4 packages — read that instead of re-scanning source files

### What assumptions changed
- Originally assumed SpEL might be worth porting — analysis shows JS template literals and existing placeholder resolution cover most use cases, so it's deferred
- Originally assumed decorator-based marking might have alternatives — confirmed static class properties are the most viable pure JS approach
