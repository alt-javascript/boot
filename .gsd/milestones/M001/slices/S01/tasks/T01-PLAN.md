---
estimated_steps: 6
estimated_files: 15
---

# T01: Deep audit of existing @alt-javascript capabilities

**Slice:** S01 — Spring Framework & Boot Core Gap Analysis
**Milestone:** M001

## Description

Systematically read every source file across the four packages (boot, cdi, config, logger) and produce a precise inventory of existing capabilities — every public API, lifecycle hook, wiring mechanism, config resolution path, scope type, profile feature, and cross-package integration point. Note code health issues.

## Steps

1. Read all source files in boot package (Boot.js, Application.js, Boot-browser.js, Application-browser.js, index.js, index-browser.js)
2. Read all source files in cdi package (ApplicationContext.js, context/*.js)
3. Read all source files in config package (all *.js at root)
4. Read all source files in logger package (all *.js at root)
5. Catalog every public capability with source file references
6. Note cross-package integration points and code health issues (duplication, inconsistencies)

## Must-Haves

- [ ] Every public class/function across 4 packages cataloged
- [ ] Source file references for each capability
- [ ] Code health observations documented (duplicated global-ref, etc.)
- [ ] Cross-package integration points mapped

## Verification

- Inventory document written to T01-SUMMARY.md with complete catalog
- No major public API missed (cross-check against index.js exports)

## Inputs

- Source files in boot, ../cdi, ../config, ../logger
- package.json files for dependency relationships

## Expected Output

- `.gsd/milestones/M001/slices/S01/tasks/T01-SUMMARY.md` — Complete capability inventory
