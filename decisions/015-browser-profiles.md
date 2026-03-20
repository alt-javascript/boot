# ADR-015: Browser Profile Resolution via URL Mapping

- **Status:** Accepted
- **Date:** 2026-03-18
- **Deciders:** Craig Parravicini

## Context

The v2 framework used `WindowLocationSelectiveConfig` to resolve browser config. It encoded the URL origin as a config key by replacing dots with `+` characters:

```javascript
{ "http://127+0+0+1:8080/": { api: { url: "http://localhost:8081" } } }
```

This worked but had poor ergonomics: the encoding was non-obvious, the config structure was flat (not hierarchical), and it was completely different from the server-side profile system.

## Decision

Replace URL-key encoding with declarative URL-to-profile mapping via `BrowserProfileResolver` + `ProfileAwareConfig`:

```javascript
{
  api: { url: 'https://api.example.com' },
  profiles: {
    urls: { 'localhost:8080': 'dev', '*.example.com': 'prod' },
    dev: { api: { url: 'http://localhost:8081' } },
  },
}
```

Matching rules: exact host:port → hostname → wildcard (`*.example.com`) → `?profile=` query parameter → default.

## Consequences

**Positive:**
- Symmetric with server-side profiles — `conditionalOnProfile('dev')` works in both environments
- Clean, hierarchical config structure
- Supports wildcards and query parameter overrides
- Profile names are reusable across URL patterns

**Negative:**
- Breaking change from v2 `WindowLocationSelectiveConfig`
- `WindowLocationSelectiveConfig` is still exported for backward compatibility but is no longer the recommended approach
