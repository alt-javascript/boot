# S01: Spring Framework & Boot Core Gap Analysis

**Goal:** Produce a comprehensive gap matrix mapping every relevant Spring Framework core and Spring Boot core feature against the four @alt-javascript packages, with relevance/feasibility/priority ratings.
**Demo:** A gap analysis document exists at `.gsd/milestones/M001/slices/S01/S01-GAP-ANALYSIS.md` covering all Spring core feature areas with concrete ratings and JS-specific feasibility notes.

## Must-Haves

- Every Spring Framework core feature area covered: IoC container, DI mechanisms, bean scopes, bean lifecycle, BeanPostProcessor/BeanFactoryPostProcessor, events, Environment/profiles, property sources, SpEL, AOP, resource abstraction, aware interfaces
- Every Spring Boot core feature area covered: auto-configuration, @Conditional* conditions, starter conventions, externalized config, actuator health/info, failure analyzers, banner/startup
- Each feature rated: relevance (high/medium/low/n-a), feasibility in pure JS (high/medium/low/blocked), priority (P1/P2/P3/defer)
- Existing @alt-javascript coverage noted for each feature: full/partial/none/n-a
- Pure JS constraint (R011, R012) respected in all feasibility assessments

## Proof Level

- This slice proves: contract
- Real runtime required: no
- Human/UAT required: yes — user reviews analysis for completeness and accuracy

## Verification

- Gap analysis document exists and covers all listed feature areas
- Every feature row has all four columns filled: coverage, relevance, feasibility, priority
- Document references actual source files in the four packages as evidence for coverage claims

## Tasks

- [x] **T01: Deep audit of existing @alt-javascript capabilities** `est:1h`
  - Why: Before comparing to Spring, need a precise inventory of what already exists across all four packages
  - Files: `Boot.js`, `Application.js`, `../cdi/ApplicationContext.js`, `../cdi/context/*.js`, `../config/*.js`, `../logger/*.js`
  - Do: Read all source files systematically. Catalog: every public API, every lifecycle hook, every wiring mechanism, every config resolution path, every scope type, every profile feature, every cross-package integration point. Note code health issues (duplication, dead code, inconsistencies).
  - Verify: Inventory document is written with file references
  - Done when: Every public capability across the four packages is cataloged with source file references

- [x] **T02: Spring Framework core feature mapping** `est:1.5h`
  - Why: Map each Spring Framework core feature against the inventory from T01
  - Files: `.gsd/milestones/M001/slices/S01/S01-GAP-ANALYSIS.md`
  - Do: For each Spring Framework core area (IoC, DI, scopes, lifecycle, events, profiles, SpEL, AOP, resources, aware interfaces, BeanPostProcessor), document: what Spring does, what @alt-javascript does (with file refs), the gap, relevance rating, feasibility in pure JS, priority. Use web search for any Spring features needing verification.
  - Verify: All Spring Framework core areas have entries in the gap analysis
  - Done when: Spring Framework core section is complete with all ratings filled

- [x] **T03: Spring Boot core feature mapping and final synthesis** `est:1h`
  - Why: Complete the analysis with Spring Boot core features and produce the final rated document
  - Files: `.gsd/milestones/M001/slices/S01/S01-GAP-ANALYSIS.md`
  - Do: For each Spring Boot core area (auto-configuration, conditional beans, starters, externalized config, actuator, failure analyzers, banner), document the same columns as T02. Write a synthesis section with top-5 priority improvements and cross-cutting observations (code duplication, shared abstractions, monorepo implications). Produce a summary table for quick reference.
  - Verify: All Spring Boot core areas have entries, synthesis section exists with top-5 priorities
  - Done when: Complete gap analysis document exists with all ratings, synthesis, and summary table

## Files Likely Touched

- `.gsd/milestones/M001/slices/S01/S01-GAP-ANALYSIS.md` (primary deliverable)
- `.gsd/milestones/M001/slices/S01/tasks/T01-SUMMARY.md` through `T03-SUMMARY.md`
