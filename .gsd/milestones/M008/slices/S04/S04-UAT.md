# S04 UAT — Hono REST API Example

**Status:** Ready for human sign-off

---

## Package

`packages/example-4-1-servers-hono`

## What this demonstrates

- `honoAutoConfiguration()` — adds `HonoAdapter` to the CDI context with one call
- `static __routes` — same declarative routing convention; handlers return plain objects (HonoControllerRegistrar calls `c.json()` automatically)
- Hono uses the Web Standards Request/Response API — runs unchanged on Node.js, Cloudflare Workers, Deno, Bun
- For Node.js serving, `HonoAdapter.run()` uses `@hono/node-server`
- Profile-driven port: default `3000`, dev `3001`
- Clean shutdown via CDI destroy lifecycle

## How to run

```bash
cd packages/example-4-1-servers-hono

# Default profile — port 3000, Hello greeting
npm start

# Dev profile — port 3001, G'day greeting
npm run start:dev
```

## Endpoints

```
GET /              → { "status": "ok", "app": "Hono Example", "version": "1.0.0" }
GET /greet/:name   → { "message": "Hello, <name>!" }
```

## Evidence from implementation run

```
   @alt-javascript/boot :: 3.0.4

...GreetingService:info:GreetingService ready — greeting: "Hello"
...GreetingController:debug:GreetingController initialised
...Application:info:[Hono Example] running — http://localhost:3000
...ROOT:info:Hono listening on 0.0.0.0:3000

GET /             → {"status":"ok","app":"Hono Example","version":"1.0.0"}
GET /greet/World  → {"message":"Hello, World!"}

# dev profile (port 3001)
GET /greet/World  → {"message":"G'day, World!"}

# SIGINT (process.emit test) — 3 listeners
...ROOT:info:Hono server closing...
...GreetingService:info:GreetingService shutting down
# → process exits cleanly
```

---

## Acceptance Checklist

**All boxes must be checked before S05 begins.**

- [x] `npm start` — banner prints, server listens on port 3000
- [x] `GET /` — returns `{ "status": "ok", "app": "Hono Example", "version": "1.0.0" }`
- [x] `GET /greet/World` — returns `{ "message": "Hello, World!" }`
- [x] `GET /greet/Alt-JavaScript` — returns `{ "message": "Hello, Alt-JavaScript!" }`
- [x] `npm run start:dev` — server listens on port 3001, greeting is `G'day`
- [x] Ctrl+C — server closes cleanly
- [x] Controller handlers return plain objects (no `res.json()` / `reply.send()`)

---

## Feedback Notes

> _(Add observations, issues, or suggestions before signing off)_

---

## Sign-Off

- [x] **I have run the example and all checklist items above are satisfied.**

  Signed off by: craigparra Date: 2026-043-24
