# S04: Monorepo Evaluation & Synthesis

**Goal:** Evaluate monorepo viability with a working prototype, and produce the final prioritized v3.0 recommendations document synthesizing all findings from S01-S03.
**Demo:** npm workspaces prototype with shared global-ref code extracted and cross-package tests running. Final recommendations document at `.gsd/milestones/M001/slices/S04/S04-RECOMMENDATIONS.md`.

## Must-Haves

- Monorepo prototype using npm workspaces (or documented rejection with evidence)
- Shared global-ref code extracted to demonstrate deduplication
- Cross-package test execution verified
- Final v3.0 recommendations document with prioritized improvement list, effort estimates, and dependency ordering
- Recommendations grounded in actual PoC results from S02 and S03

## Proof Level

- This slice proves: contract
- Real runtime required: yes — monorepo prototype must build/test
- Human/UAT required: yes — user reviews recommendations

## Verification

- Monorepo prototype exists and tests pass, OR rejection is documented with evidence
- Recommendations document exists with all required sections

## Tasks

- [x] **T01: Monorepo prototype and v3.0 recommendations** `est:2h`
  - Why: Final deliverable of the milestone — prove monorepo viability and synthesize all findings
  - Files: `poc/monorepo/`, `.gsd/milestones/M001/slices/S04/S04-RECOMMENDATIONS.md`
  - Do: (1) Create a minimal npm workspaces prototype demonstrating shared code extraction. Test that the four packages can share a common global-ref module. (2) Write the final recommendations document synthesizing gap analysis (S01), auto-discovery findings (S02), and container enhancement PoC results (S03). Prioritize improvements, estimate effort, and define dependency ordering for a v3.0 milestone.
  - Verify: Monorepo prototype tests pass. Recommendations document is complete.
  - Done when: Both deliverables exist and are verified

## Files Likely Touched

- `poc/monorepo/` — workspace prototype
- `.gsd/milestones/M001/slices/S04/S04-RECOMMENDATIONS.md`
