# ADR-017: .env File Support in ProfileConfigLoader

- **Status:** Accepted
- **Date:** 2026-03-26
- **Deciders:** Craig Parravicini

## Context

`ProfileConfigLoader` already supports JSON, YAML, and `.properties` config files with Spring-aligned profile-based precedence. However, it had no support for `.env` files — the widely-used format popularised by the `dotenv` package and adopted as a de facto standard in the JavaScript ecosystem (Node.js, Docker Compose, Vite, Next.js, etc.).

Developers working in the JavaScript ecosystem expect to be able to write:

```env
DATABASE_URL=postgres://localhost:5432/mydb
APP_PORT=3000
```

and have those values feed into the configuration system the same way as `process.env` — including relaxed binding (`DATABASE_URL` → `database.url`).

The question was: where do `.env` files sit in the precedence chain? Two positions were considered:

1. **Above `process.env`** — `.env` files override real environment variables. Enables dev overrides but means a checked-in file can shadow production secrets.
2. **Below `process.env`, above file-based config** — `.env` fills in what the environment doesn't provide. Standard dotenv convention; safe for production.

## Decision

Implement `.env` file support in `ProfileConfigLoader` with the following design:

1. **Discovery** — `application.env` and `application-{profile}.env` are discovered in the same `SEARCH_DIRS` (`config/`, `.`) as all other config files. No new configuration required.

2. **Parsing** — A new `DotEnvParser` class handles the `.env` format: bare `KEY=VALUE`, `export KEY=VALUE` stripping, double-quoted values with escape sequences (`\n \t \r \\ \"`), single-quoted values (literal, no escapes), inline comments (preceded by whitespace), empty values, comment lines, and blank lines. Multiline values and variable interpolation are out of scope for v1.

3. **Source wrapping** — Parsed `.env` content is wrapped in `EnvPropertySource` (not `EphemeralConfig`). This delivers relaxed binding identically to `process.env`: `MY_APP_PORT` is accessible as both `MY_APP_PORT` and `my.app.port`.

4. **Precedence slot** — `.env` sources sit between `process.env` and profile config files. Real environment variables always win; `.env` fills in what they don't provide.

The full 7-layer precedence chain is:

| Priority | Source |
|---|---|
| 1 | Programmatic overrides |
| 2 | `process.env` |
| 3 | Profile-specific `.env` files (`application-{profile}.env`) |
| 4 | Default `.env` file (`application.env`) |
| 5 | Profile-specific config files (`application-{profile}.json/yaml/properties`) |
| 6 | Default config files (`application.json/yaml/properties`) |
| 7 | Fallback |

No new npm dependencies are introduced — `DotEnvParser` is a pure JavaScript implementation.

## Consequences

**Positive:**
- Familiar `.env` format works out of the box — no `dotenv` package needed
- Relaxed binding is consistent — `DB_HOST` in `.env` and `DB_HOST` in environment behave identically
- Profile-specific `.env` files follow the same pattern as other profile config files
- No new configuration API — files are discovered automatically
- Real env vars always win — `.env` files are safe to commit for dev defaults

**Negative:**
- `.env` values are strings only (no JSON types) — numeric and boolean values arrive as strings
- No multiline values or variable interpolation in v1
- `.env` files in `config/` or project root are auto-loaded — teams must ensure secrets are not committed

**Risks:**
- Developers may expect `${VAR}` interpolation inside `.env` values (common in some dotenv implementations). v1 does not support this — values are literal. Document clearly.
