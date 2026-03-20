# S04: Monorepo Evaluation & Synthesis — UAT

## Prerequisites
- `npm test` passes (74 tests)
- `cd poc/monorepo && npm test` passes (8 tests)

## Test Steps

### 1. Monorepo Prototype
- [ ] Run `cd poc/monorepo && npm test` — 8 tests pass
- [ ] Review `poc/monorepo/packages/common/index.js` — shared global-ref code
- [ ] Confirm boot-lite and cdi-lite import from common (no duplication)
- [ ] Confirm cross-package integration test proves boot→cdi context sharing

### 2. Recommendations Document
- [ ] Read `.gsd/milestones/M001/slices/S04/S04-RECOMMENDATIONS.md`
- [ ] Verify P1 items are in dependency order
- [ ] Verify effort estimates feel reasonable
- [ ] Verify deferred items are justified
- [ ] Confirm EphemeralConfig bug is documented

### 3. Decisions Register
- [ ] Check `.gsd/DECISIONS.md` — D006-D009 recorded for monorepo, AOP, events, discovery
