# S03 UAT — Fastify REST API Example

**Status:** Ready for human sign-off

---

## Package

`packages/example-3-1-intro-fastify`

## What this demonstrates

- `fastifyAutoConfiguration()` — adds `FastifyAdapter` to the CDI context with one call
- `static __routes` — same declarative routing convention as Express; Fastify uses `(request, reply)` and `reply.send()`
- `Boot.boot({ contexts })` — identical entry point pattern to S02; only the import changes
- Profile-driven port: default `3000`, dev `3001`
- Clean shutdown via CDI destroy lifecycle

## How to run

```bash
cd packages/example-3-1-intro-fastify

# Default profile — port 3000, Hello greeting
npm start

# Dev profile — port 3001, G'day greeting
npm run start:dev
```

## Endpoints

```
GET /              → { "status": "ok", "app": "Fastify Example", "version": "1.0.0" }
GET /greet/:name   → { "message": "Hello, <name>!" }
```

## Evidence from implementation run

```
   @alt-javascript/boot :: 3.0.4

...GreetingService:info:GreetingService ready — greeting: "Hello"
...GreetingController:debug:GreetingController initialised
...Application:info:[Fastify Example] running — http://localhost:3000
...ROOT:info:Fastify listening on 0.0.0.0:3000

GET /             → {"status":"ok","app":"Fastify Example","version":"1.0.0"}
GET /greet/World  → {"message":"Hello, World!"}

# dev profile (port 3001)
GET /greet/World  → {"message":"G'day, World!"}

# SIGINT (process.emit test) — 3 listeners registered
...ROOT:info:Fastify server closing...
...GreetingService:info:GreetingService shutting down
# → process exits cleanly
```

---

## Acceptance Checklist

**All boxes must be checked before S04 begins.**

- [x] `npm start` — banner prints (with blank line after version), server listens on port 3000
- [X] `GET /` — returns `{ "status": "ok", "app": "Fastify Example", "version": "1.0.0" }`
- [X] `GET /greet/World` — returns `{ "message": "Hello, World!" }`
- [X] `GET /greet/Alt-JavaScript` — returns `{ "message": "Hello, Alt-JavaScript!" }`
- [X] `npm run start:dev` — server listens on port 3001, greeting is `G'day`
- [X] Ctrl+C — server closes cleanly (no hanging process)
- [X] `main.js` differs from Express example only in the import and `fastifyAutoConfiguration()`

---

## Feedback Notes

> _(Add observations, issues, or suggestions before signing off)_

---

## Sign-Off

- [X] **I have run the example and all checklist items above are satisfied.**

  Signed off by: craigparra Date: 2026-043-24
