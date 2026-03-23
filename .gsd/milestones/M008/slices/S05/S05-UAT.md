# S05 UAT — Koa REST API Example

**Status:** Ready for human sign-off

---

## Package

`packages/example-5-1-intro-koa`

## What this demonstrates

- `koaStarter()` — adds `KoaAdapter` to the CDI context with one call
- `static __routes` — same declarative routing convention; handlers return plain objects
- Koa is the async/await successor to Express — built-in `async/await` middleware composition
- Profile-driven port: default `3000`, dev `3001`
- Clean shutdown via CDI destroy lifecycle

## How to run

```bash
cd packages/example-5-1-intro-koa

# Default profile — port 3000, Hello greeting
npm start

# Dev profile — port 3001, G'day greeting
npm run start:dev
```

## Endpoints

```
GET /              → { "status": "ok", "app": "Koa Example", "version": "1.0.0" }
GET /greet/:name   → { "message": "Hello, <name>!" }
```

## Evidence from implementation run

```
   @alt-javascript/boot :: 3.0.4

...GreetingService:info:GreetingService ready — greeting: "Hello"
...GreetingController:debug:GreetingController initialised
...Application:info:[Koa Example] running — http://localhost:3000
...ROOT:info:Koa listening on 0.0.0.0:3000

GET /             → {"status":"ok","app":"Koa Example","version":"1.0.0"}
GET /greet/World  → {"message":"Hello, World!"}

# dev profile (port 3001)
GET /greet/World  → {"message":"G'day, World!"}

# SIGINT (process.emit test) — 3 listeners
...ROOT:info:Koa server closing...
...GreetingService:info:GreetingService shutting down
# → process exits cleanly
```

---

## Acceptance Checklist

**All boxes must be checked before S06 begins.**

- [ ] `npm start` — banner prints, server listens on port 3000
- [ ] `GET /` — returns `{ "status": "ok", "app": "Koa Example", "version": "1.0.0" }`
- [ ] `GET /greet/World` — returns `{ "message": "Hello, World!" }`
- [ ] `GET /greet/Alt-JavaScript` — returns `{ "message": "Hello, Alt-JavaScript!" }`
- [ ] `npm run start:dev` — server listens on port 3001, greeting is `G'day`
- [ ] Ctrl+C — server closes cleanly

---

## Feedback Notes

> _(Add observations, issues, or suggestions before signing off)_

---

## Sign-Off

- [ ] **I have run the example and all checklist items above are satisfied.**

  Signed off by: __________________ Date: __________________
