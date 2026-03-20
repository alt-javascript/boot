# M004: Documentation

## Goal

Comprehensive documentation for the `@alt-javascript` v3.0 framework — both inline code documentation (JSDoc) and user-facing repository documentation (README, guides, reference, decisions).

## Context

- 351 tests passing across 5 packages (common, boot, cdi, config, logger)
- 64 source files, 0 READMEs in monorepo
- Minimal inline docs — ~70 JSDoc comments total across all packages
- 10 architectural decisions in GSD register (D001–D010)
- Project is idiosyncratic: pure JS (no TypeScript), browser isomorphism, Spring-inspired IoC in a Node/browser JS ecosystem that normally uses TypeScript decorators

## Audience

Primary: JavaScript developers familiar with Spring (Java) concepts who want DI/IoC in pure JS.
Secondary: JS developers who want structured DI without TypeScript or build tooling.

## Constraints

- Documentation lives in the monorepo at `../altjs/`
- README.md is the entry point
- docs/ directory for expanded documentation
- decisions/ directory for MADR-format ADRs
- No external docs site needed yet — Markdown files in repo
- Must be accurate against current code (351 tests prove the features work)

## Open Questions

- None — scope is clear from user direction

## Risks

- Code-level docs on 64 files is volume work — risk of inconsistency across packages
- Spring comparison requires precise framing — similarities AND differences
