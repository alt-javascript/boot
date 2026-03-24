# S16 — Browser-Safe Package Split: Research

**Date:** 2026-03-24

## Summary

The `@alt-javascript/*` packages contain a clear but informal browser/Node split that
has grown organically. `config` has a `browser/` subdirectory. `boot` has
`Boot-browser.js`. Neither is exposed via `package.json` `exports` conditions, so
bundlers (Vite, webpack) resolve the main entry — which imports Node-only code
(`fs`, `path`, `jasypt/crypto`) — and then fail or require manual aliases to repair.

The **Node-only surface is narrow and well-contained**:

| Package | Node-only files | Node APIs used |
|---------|----------------|----------------|
| `config` | `ConfigFactory.js`, `ProfileConfigLoader.js`, `JasyptDecryptor.js` | `fs`, `path`, `module`, `@alt-javascript/jasypt` (→ `crypto`) |
| `logger` | none | *(LoggerFactory imports `{ config }` from config — transitively pulls Node deps)* |
| `cdi` | none direct | imports `{ config, ConfigFactory }` from config main entry — transitively pulls Node deps |
| `boot` | `Boot.js`, `Application.js` | `module` (`createRequire` for banner) |
| `common` | none | fully browser-safe |

Everything else — `EphemeralConfig`, `ValueResolvingConfig`, `PlaceHolderResolver`,
`BrowserProfileResolver`, `ProfileAwareConfig`, `URLResolver`, `LoggerFactory`,
`LoggerCategoryCache`, `ApplicationContext`, `Context`, `Singleton` — is already
environment-agnostic. The work is small.

## Recommendation

**Use `package.json` `exports` conditions** (`"browser"` / `"default"`) to point
bundlers (Vite, webpack 5, Rollup ≥3) at browser-safe entry points — no new packages,
no new names, no consumer configuration required.

For CDN `<script type="module">` usage (which doesn't resolve `exports` conditions),
the existing rollup-built `.esm.js` dist files continue to work unchanged.

This gives us the zero-alias goal for Vite/webpack consumers and backwards-compat for
CDN users in a single change per package.

### Why not separate `*-lite` packages

- Adds package names, versioning, and publish complexity for what is a boundary within
  existing code, not a capability addition.
- CDN importmaps would need updating to `@alt-javascript/config-lite` etc.
- The separation already exists structurally (`browser/index.js`). What's missing is
  the `exports` map wiring.

### Why not a Vite plugin

- Pushes the fix to every consumer project. The problem is in the packages, not in
  the consumer.

## Implementation Landscape

### The `exports` conditions approach

```json
// packages/config/package.json
{
  "exports": {
    ".": {
      "browser": "./browser/index.js",
      "default": "./index.js"
    },
    "./browser/index.js": "./browser/index.js"
  }
}
```

When Vite (or any bundler honouring `exports`) resolves `@alt-javascript/config`,
it picks `browser/index.js` automatically. No vite.config.js alias needed.
Node.js (server-side) picks `default` → `index.js`. The CDN dist points directly
to the dist file via importmap and is unaffected.

Same pattern for `logger`, `cdi`, `boot`.

### Per-package changes

#### `config`

`browser/index.js` already exists and is nearly complete.

**Missing from `browser/index.js`:**
- `config` sentinel export (added in S10 — already there)
- `PropertySourceChain` — currently not exported from browser entry; needed by
  `Boot-browser.js` for test overlay (can be added safely — no Node deps)
- `EnvPropertySource` — reads `process.env` which is available in Node and polyfilled
  by most bundlers; fine to include

**`browser/ConfigFactory.js`** — already omits `JasyptDecryptor` and `ProfileConfigLoader`.
No changes needed.

**Add to `package.json`:**
```json
"exports": {
  ".": { "browser": "./browser/index.js", "default": "./index.js" },
  "./browser/index.js": "./browser/index.js"
}
```

#### `logger`

`LoggerFactory.js` imports `{ config }` from `@alt-javascript/config`. When `exports`
conditions are in place, this resolves to `browser/index.js` in a browser context,
getting the `config = new EphemeralConfig({})` sentinel — exactly as intended.

`CachingLoggerFactory` — already browser-safe (no `crypto` usage confirmed above).

**No new browser entry needed** — once config `exports` conditions are set, `logger`
is clean. `CachingLoggerFactory` is not exported from the logger index; it's only used
by `Boot.test()` (Node-only). No change needed.

**Add to `package.json`:** `"exports": { ".": { "default": "./index.js" } }`
(single entry; browser-safe once config is fixed)

#### `cdi`

`ApplicationContext.js` imports `{ config as defaultConfig, ConfigFactory }` from
`@alt-javascript/config`. Same as logger — clean once config `exports` conditions propagate.

`lodash` — Vite's dependency pre-bundler handles `lodash` fine (it bundles it as a
browser-safe chunk). No issue; confirmed by S10 working after config/jasypt aliases were set.

**No new browser entry needed.**

**Add to `package.json`:** `"exports": { ".": { "default": "./index.js" } }`

#### `boot`

`Boot.js` uses `createRequire` from `'module'` (Node built-in) for banner version
resolution. Already guarded with `detectBrowser()` — never called in browser. Vite
externalises `'module'` — this causes a warning but not a breakage.

`Boot-browser.js` is already the correct browser entry.

**Add to `package.json`:**
```json
"exports": {
  ".": {
    "browser": "./index-browser.js",
    "default": "./index.js"
  }
}
```

`index-browser.js` re-exports from `Boot-browser.js` and `Application-browser.js` —
already present. Vite picks this up automatically; no alias needed.

### What this eliminates from vite.config.js

```js
// BEFORE: five aliases required
resolve: {
  alias: [
    { find: /^@alt-javascript\/config\/browser\/index\.js$/, ... },
    { find: '@alt-javascript/config', ... },
    { find: '@alt-javascript/boot', ... },
    { find: '@alt-javascript/jasypt', ... },
  ],
}

// AFTER: zero aliases
// vite.config.js needs only the vue plugin
export default defineConfig({ plugins: [vue()] });
```

### Key Files

- `packages/config/package.json` — add `exports` field
- `packages/config/browser/index.js` — add `PropertySourceChain` export if needed by Boot-browser
- `packages/logger/package.json` — add `exports` field
- `packages/cdi/package.json` — add `exports` field
- `packages/boot/package.json` — add `exports` field
- `packages/example-4-2-frontend-vue-vite/vite.config.js` — remove all aliases
- Any future `example-4-*/vite.config.js` — starts clean with no aliases

### Build Order

1. `config` exports map + verify `browser/index.js` is complete
2. Verify `logger` is clean (no changes expected — just confirm)
3. Verify `cdi` is clean (same)
4. `boot` exports map
5. Remove aliases from S10 vite.config.js, run dev server, verify app works
6. Verify all existing mocha test suites still pass (they use Node resolution → `default`)

### Verification Approach

- `npm test` from workspace root — all 20 suites pass (Node path unchanged)
- S10 Vite dev server — `http://localhost:5173` and `http://127.0.0.1:5173` render
  with correct profile badges and no console warnings about `fs`, `crypto`, `path`
- S09 CDN server — `http://localhost:3000/dev` renders correctly (importmap unchanged)
- `vite build` in S10 — clean build with no Node module warnings

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| Browser entry selection | `package.json` `"exports"` `"browser"` condition | Standard; zero consumer config; supported by Vite, webpack 5, Rollup ≥3 |
| CDN dist | Existing rollup builds | Importmaps bypass `exports`; dist files work directly |

## Constraints

- Vite honours `"browser"` condition in `exports` by default. Node.js (≥12) honours
  `exports` but uses `"default"`, not `"browser"` — correct behaviour.
- `exports` fields are strict: if an `exports` field is present, unlisted subpath
  imports (`@alt-javascript/config/SomeClass.js`) are blocked. All currently-used
  subpaths must be added. Audit needed.
- Rollup (used by boot-vue) also honours `exports` conditions — may need `browser: true`
  in rollup plugin options for dist builds targeting browser.

## Common Pitfalls

- **Subpath breakage** — Adding `exports` without listing all used subpaths will block
  imports like `@alt-javascript/cdi/context/index.js`. Audit all imports across the
  workspace before publishing. Add `"./context/index.js": "./context/index.js"` etc.
- **Rollup dist builds** — When building `boot-vue` dist, rollup resolves `@alt-javascript/boot`
  via `exports`. The browser condition should produce `index-browser.js`, which is correct
  for the CDN dist. Verify after adding exports map.
- **Test suite** — Mocha runs under Node. `exports` `"default"` condition → `index.js`
  (Node path). Should be transparent; verify no regressions.

## Open Risks

- Subpath export audit may reveal imports we haven't catalogued. Low risk given the
  workspace is a monorepo and we can grep exhaustively.
- `WindowLocationSelectiveConfig` in `browser/ConfigFactory.js` — reads
  `window.location.search`. Fine in browser; in Node test context (jsdom) this is
  polyfilled. Confirm Vitest jsdom polyfills `window.location`.
