# ADR-011: Monorepo with npm Workspaces

- **Status:** Accepted
- **Date:** 2026-03-18
- **Deciders:** Craig Parravicini

## Context

The four original packages lived in separate GitHub repositories. This caused: duplicated utility code across all four, version drift between packages, circular test dependencies, and painful release coordination (updating cross-package versions manually).

## Decision

Consolidate into a single monorepo using npm workspaces. Five packages: `common` (new shared kernel), `boot`, `cdi`, `config`, `logger`. New repository with fresh git history — no baggage from the four separate repos.

## Consequences

**Positive:**
- Cross-package changes are atomic commits
- Shared code lives in `@alt-javascript/common` — no duplication
- `npm test` at root runs all packages
- Coordinated versioning (all 3.0.0-alpha.0)

**Negative:**
- Original repositories need archiving
- Contributors must understand monorepo structure
- CI must test all packages on every change (but test suite is fast: ~5 seconds)
