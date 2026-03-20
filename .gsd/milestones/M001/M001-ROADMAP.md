# M001: Spring Core Gap Analysis & PoC Spikes

**Vision:** Systematically map the @alt-javascript core framework against Spring Framework core and Spring Boot core, identify the highest-value gaps, prove the top improvements work in pure JS via PoC spikes, and produce a prioritized v3.0 recommendation.

## Success Criteria

- Every major Spring Framework core feature has a corresponding entry in the gap analysis with relevance/feasibility/priority ratings
- Every major Spring Boot core feature has a corresponding entry in the gap analysis with relevance/feasibility/priority ratings
- Component auto-discovery PoC works in pure JS without decorator syntax or transpiler
- At least 2 additional container enhancement PoCs (from: AOP, events, lifecycle, conditional beans) work with passing tests
- Monorepo prototype demonstrates shared code extraction and cross-package tests, or is rejected with evidence
- Prioritized v3.0 recommendations document synthesizes all findings with effort estimates

## Key Risks / Unknowns

- No native decorator support in JS engines — auto-discovery must find alternative mechanisms
- ESM static module graph prevents classpath-style scanning — discovery approach must work within ESM constraints
- Proxy-based AOP performance unknown for hot paths
- Monorepo may surface circular dependency issues between the four packages

## Proof Strategy

- No native decorator support → retire in S02 by building a working auto-discovery PoC using static class properties or convention-based approaches
- Proxy AOP performance → retire in S03 by benchmarking Proxy interception against direct calls
- Monorepo circular deps → retire in S04 by building a workspace prototype and running the full test suite

## Verification Classes

- Contract verification: PoC tests pass, gap analysis document covers all feature areas, recommendation document exists
- Integration verification: PoC spikes work within existing module structure and test harness
- Operational verification: none
- UAT / human verification: user reviews gap analysis for completeness and recommendation quality

## Milestone Definition of Done

This milestone is complete only when all are true:

- Gap analysis document covers Spring Framework core + Spring Boot core features with ratings
- Component auto-discovery PoC has passing tests in pure JS
- At least 2 additional container enhancement PoCs have passing tests
- Monorepo prototype works or is rejected with documented evidence
- Prioritized v3.0 recommendations document exists with effort estimates
- All PoC code works as flat ESM in Node.js (browser verification where applicable)

## Requirement Coverage

- Covers: R001, R002, R003, R004, R005, R006, R007, R008, R009, R010
- Partially covers: none
- Leaves for later: R013, R014
- Orphan risks: none

## Slices

- [x] **S01: Spring Framework & Boot Core Gap Analysis** `risk:medium` `depends:[]`
  > After this: A comprehensive gap matrix document exists mapping every Spring Framework core and Spring Boot core feature against the four @alt-javascript packages, with relevance/feasibility/priority ratings for each gap.

- [x] **S02: Component Auto-Discovery PoC** `risk:high` `depends:[S01]`
  > After this: Working pure JS code demonstrates components self-registering into ApplicationContext without explicit `new Component(MyClass)` boilerplate — tests pass in the existing mocha harness.

- [x] **S03: Container Enhancement PoCs** `risk:medium` `depends:[S01]`
  > After this: Working pure JS spikes for AOP method interception, application event bus, conditional bean registration, and enhanced lifecycle hooks — each with passing tests.

- [x] **S04: Monorepo Evaluation & Synthesis** `risk:low` `depends:[S01,S02,S03]`
  > After this: npm workspaces prototype with shared global-ref code extracted and cross-package tests passing (or rejection with evidence). Final prioritized v3.0 recommendations document synthesizes all findings.

## Boundary Map

### S01 → S02

Produces:
- Gap analysis document with rated feature matrix — identifies which auto-discovery approaches are worth prototyping
- Feasibility notes on decorator alternatives for component marking in pure JS

Consumes:
- nothing (first slice)

### S01 → S03

Produces:
- Gap analysis document identifying AOP, events, lifecycle, and conditional bean gaps with feasibility ratings
- Specific Spring patterns worth prototyping for each enhancement area

Consumes:
- nothing (first slice)

### S01 → S04

Produces:
- Gap analysis findings on cross-cutting code duplication and shared abstractions
- Monorepo-relevant observations from analyzing the four packages

Consumes:
- nothing (first slice)

### S02 → S04

Produces:
- Working auto-discovery PoC code demonstrating the recommended approach
- Lessons learned about pure JS constraints for component metadata

Consumes from S01:
- Gap analysis feasibility notes on discovery approaches

### S03 → S04

Produces:
- Working PoC code for AOP, events, conditional beans, lifecycle
- Lessons learned about Proxy performance, event system design choices

Consumes from S01:
- Gap analysis feasibility notes on each enhancement area
