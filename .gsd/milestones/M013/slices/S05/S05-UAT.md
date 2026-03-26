# S05: Examples \u2014 Auth + Logging + Error Handling end-to-end — UAT

**Milestone:** M013
**Written:** 2026-03-26T12:08:20.866Z

## UAT — S05: Examples\n\n### Express example-2-1\n- `AuthMiddleware` registered as CDI component with `static __middleware = { order: 5 }`\n- `/` and `/health` are public (skip auth)\n- `/greet/:name` and `/secret` require `Authorization: Bearer <token>`\n- curl without token → 401; with token → 200\n\n### Lambda example-3-1\n- Same AuthMiddleware pattern — same source could be shared\n- `GET /health` → 200 (public)\n- `GET /greet/{name}` without token → 401 ✅\n- `GET /greet/{name}` with token → 200 ✅\n- `GET /secret` with token → 200 ✅\n- 7 tests passing\n\n### DECISIONS.md\n- D028 recorded: CDI middleware pipeline architecture
