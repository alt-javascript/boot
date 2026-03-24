---
id: S16
milestone: M008
status: ready
---

# S16: Browser-Safe Package Split — Research & Design

## Goal

Research and produce a concrete design for splitting `config`, `logger`, `cdi`, and `boot`
into browser-first (`*-lite`) variants, eliminating the vite.config.js alias patches and
the underlying collision between browser and Node-only code paths.

## Why this Slice

S10 required five Vite aliases (`@alt-javascript/boot → Boot-browser.js`,
`@alt-javascript/config → browser/index.js`, `@alt-javascript/jasypt → stub`) to stop
Node-only modules (`fs`, `path`, `crypto`, `yaml`, `jasypt`) from reaching the browser
bundle. This is fragile and invisible to consumers of the packages. S11 (React),
S12 (Angular), and S13 (Alpine.js) would require the same aliases, or worse, discover
new collisions. Without a structural fix, every browser example accumulates bespoke
workarounds and the pattern is unteachable.

The browser and Node paths have already begun to diverge naturally:
- `Boot-browser.js` vs `Boot.js`
- `config/browser/index.js` vs `config/index.js`
- `config/browser/ConfigFactory.js` vs `config/ConfigFactory.js`

The question is: what is the right way to formalise and complete that split?

## Scope

### In Scope

- Research current package boundary and Node-only surface area in each package
- Evaluate package.json `exports` field conditioning (`browser` / `node` conditions)
  vs separate `*-lite` packages vs Vite-plugin approach
- Produce a concrete recommendation with package structure, export maps, and migration path
- Identify what existing code can be reused unchanged vs needs splitting
- Define which approach requires zero vite.config.js aliases in consumer projects
- Assess impact on existing CDN dist bundles (rollup builds for `*.esm.js`)
- Assess impact on existing server-side examples (must remain unchanged)
- Produce `S16-RESEARCH.md` and `S16-PLAN.md` (task breakdown if implementation proceeds)

### Out of Scope

- Actual implementation (that is a separate milestone)
- Changes to S01–S10 examples (those stay as-is until implementation is approved)
- Cloudflare Worker, Lambda, Azure — not affected (they target Node or workerd runtime)

## Constraints

- Existing server-side examples and test suites must not regress
- CDN dist bundles must continue to work (jsDelivr URLs in index.html examples)
- The `@alt-javascript/*` package names and versions are published; any split must be
  additive (new packages) or use `exports` map conditions that are backwards compatible
- No new external runtime dependencies

## Integration Points

### Consumes

- `packages/config/` — `ConfigFactory.js`, `ProfileConfigLoader.js`, `JasyptDecryptor.js`,
  `browser/index.js`, `browser/ConfigFactory.js` — the existing split is the starting point
- `packages/logger/` — `LoggerFactory.js`, `CachingLoggerFactory.js` — Node-only parts
- `packages/cdi/` — `ApplicationContext.js` — imports `{ config }` from config main entry
- `packages/boot/` — `Boot.js`, `Boot-browser.js`, `index-browser.js` — existing dual impl
- `packages/example-4-2-frontend-vue-vite/vite.config.js` — the aliases that should become unnecessary

### Produces

- `S16-RESEARCH.md` — analysis, options, recommendation, decision rationale
- `S16-PLAN.md` — task breakdown for the implementation milestone (if approved)
- Optional: a new `M009` milestone brief if the scope warrants it

## Open Questions

- **exports map vs separate packages** — `package.json` `"exports"` with `browser`/`node`
  conditions is the modern standard and avoids new package names. But it requires all
  consumers to use a bundler that honours exports conditions (Vite, webpack 5, Rollup ≥3).
  CDN `<script type="module">` importmaps point to dist files directly — exports conditions
  don't apply there. Worth understanding whether the CDN path needs separate dist targets.
- **`*-lite` naming** — if separate packages are preferred, what is the naming convention?
  `@alt-javascript/config-lite`? Or `@alt-javascript/config/browser` as a subpath export?
  The latter already exists partially.
- **Scope of Node-only surface** — need to enumerate exactly which files/classes in each
  package have hard Node dependencies (`fs`, `crypto`, `path`, `os`, `yaml`, `jasypt`)
  and which are already environment-agnostic.
- **CachingLoggerFactory** — uses Node `crypto` for cache-key hashing. Is there a
  browser-safe hash alternative worth including, or should caching simply be excluded
  from the lite variant?
