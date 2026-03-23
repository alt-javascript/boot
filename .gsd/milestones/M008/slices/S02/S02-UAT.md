# S02 UAT — Express REST API Example

**Status:** Ready for human sign-off

---

## Package

`packages/example-2-1-servers-express`

## What this demonstrates

- `expressAutoConfiguration()` — adds `ExpressAdapter` to the CDI context with one call
- `static __routes` — declarative route registration on controller classes
- `Boot.boot({ contexts })` — starts config, logger, banner, Express server, and lifecycle
- Profile-driven port: default `3000`, dev `3001`
- Clean shutdown via CDI destroy lifecycle (Ctrl+C → `ExpressAdapter.destroy()`)

## How to run

```bash
cd packages/example-2-1-servers-express

# Default profile — port 3000, Hello greeting
npm start

# Dev profile — port 3001, G'day greeting
npm run start:dev
```

## Endpoints

```
GET /              → { "status": "ok", "app": "Express Example", "version": "1.0.0" }
GET /greet/:name   → { "message": "Hello, <name>!" }
```

## Evidence from implementation run

```
   @alt-javascript/boot :: 3.0.4
...GreetingService:info:GreetingService ready — greeting: "Hello"
...GreetingController:debug:GreetingController initialised
...Application:info:[Express Example] running — http://localhost:3000
...ROOT:info:Express listening on 0.0.0.0:3000

GET /             → {"status":"ok","app":"Express Example","version":"1.0.0"}
GET /greet/World  → {"message":"Hello, World!"}

# dev profile (port 3001)
GET /greet/World  → {"message":"G'day, World!"}

# SIGINT (process.emit test)
...ROOT:info:Express server closing...
...GreetingService:info:GreetingService shutting down
# → process exits cleanly
```

---

## Acceptance Checklist

**All boxes must be checked before S03 begins.**

- [x] `npm start` — banner prints, server listens on port 3000
- [x] `GET /` — returns `{ "status": "ok", "app": "Express Example", "version": "1.0.0" }`
- [x] `GET /greet/World` — returns `{ "message": "Hello, World!" }`
- [x] `GET /greet/Alt-JavaScript` — returns `{ "message": "Hello, Alt-JavaScript!" }`
- [x] `npm run start:dev` — server listens on port 3001, greeting is `G'day`
- [x] Ctrl+C — server closes cleanly (no hanging process)
- [x] `main.js` is ≤10 meaningful lines
- [x] No Express boilerplate in `main.js` — all wiring via CDI and `expressAutoConfiguration()`

---

## Feedback Notes

> _(Add observations, issues, or suggestions before signing off)_

---

## Sign-Off

- [X] **I have run the example and all checklist items above are satisfied.**

  Signed off by: craigparra Date: 2026-043-24
