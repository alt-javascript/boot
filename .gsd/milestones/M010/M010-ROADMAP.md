# M010: Technical Documentation

**Vision:** Every module and example has accurate, readable technical documentation that a
developer can follow from zero to a running integration. Docs live in `docs/` as Markdown,
verified against running code.

## Success Criteria

- Every package in `@alt-javascript/*` (built through M009) has a reference page
- Every `example-*` package has a tutorial page
- Getting Started guide walks from console app to full-stack
- Cross-cutting guides cover: profiles, CDI, browser integration, serverless, persistence
- All code snippets verified against actual package exports and example files
- Human sign-off at each slice

## Key Risks / Unknowns

- M009 (persistence) must be complete before the persistence docs slice can start
- Static site tooling choice (MkDocs vs Docusaurus) affects file layout — decide in S01

## Slices

- [ ] **S01: Doc site setup + Getting Started** `risk:low` `depends:[]`
- [ ] **S02: Core module reference (config, logger, cdi, boot)** `risk:low` `depends:[S01]`
- [ ] **S03: HTTP server adapters (Express, Fastify, Hono, Koa)** `risk:low` `depends:[S01]`
- [ ] **S04: Serverless adapters (Lambda, Azure, Cloudflare)** `risk:low` `depends:[S01]`
- [ ] **S05: Browser adapters (Vue, React, Angular, Alpine)** `risk:low` `depends:[S01]`
- [ ] **S06: Persistence module (DataSource, JsdbcTemplate)** `risk:low` `depends:[S01,M009/S02]`
- [ ] **S07: Example tutorials (all example-* packages)** `risk:low` `depends:[S02,S03,S04,S05]`
- [ ] **S08: Cross-cutting guides** `risk:low` `depends:[S07]`
