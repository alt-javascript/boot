# S01 UAT — Progressive Introduction Examples (examples 1–4)

**Status:** ✅ Ready for human sign-off

---

## Structure

S01 delivers four progressive examples, each introducing one layer of the framework:

| Package | Introduces |
|---|---|
| `example-1-intro-config` | `ProfileConfigLoader` — file-based config + profiles |
| `example-2-intro-logger` | `LoggerFactory` — categories, levels, text/JSON format |
| `example-3-intro-cdi` | `ApplicationContext` — DI wiring, `static qualifier`, placeholder injection, `Application.run()` |
| `example-4-intro-boot` | `Boot.boot()` — single call bootstraps config + logger + CDI + banner |

---

## How to run

```bash
# Example 1
cd packages/example-1-intro-config
npm start                   # default profile
npm run start:dev           # dev profile (greeting + port change)

# Example 2
cd packages/example-2-intro-logger
npm start                   # text logs, debug level for this category
npm run start:json-log      # JSON log lines

# Example 3
cd packages/example-3-intro-cdi
npm start                   # Hello, World!
npm run start:dev           # G'day, World!

# Example 4
cd packages/example-4-intro-boot
npm start                   # banner + Hello, World!
npm run start:dev           # banner + G'day, World! + debug logs
npm run start:json-log      # banner + JSON log lines
```

---

## Evidence from implementation run

### Example 1 — default / dev profiles

```
App:       Config Example     Greeting:  Hello     Port:      8080
App:       Config Example     Greeting:  G'day     Port:      9090   # dev profile
```

### Example 2 — text / JSON logs

```
...@alt-javascript/example-2-intro-logger/main:debug:Config loaded...
...@alt-javascript/example-2-intro-logger/MyService:info:MyService info...
{"level":"debug","message":"Config loaded...","category":"@alt-javascript/example-2-intro-logger/main"}
```

### Example 3 — CDI with placeholder injection

```
...GreetingService:info:GreetingService ready — greeting: "Hello"
...Application:info:[CDI Example] Starting
Hello, World!
Hello, Alt-JavaScript!
...GreetingService:info:GreetingService shutting down
# dev: greeting: "G'day"
```

### Example 4 — Boot.boot() one call

```
  ____  ...banner...
   @alt-javascript/boot :: 3.0.4
...GreetingRepository:debug:GreetingRepository initialised
...GreetingService:info:GreetingService ready — greeting: "Hello"
...Application:info:[Boot Example] Running
Hello, World!
Hello, Alt-JavaScript!
...GreetingService:info:GreetingService shutting down
# dev: G'day  json-log: JSON lines throughout
```

---

## Acceptance Checklist

**All boxes must be checked before S02 begins.**

### Example 1 — Config

- [ ] `npm start` shows `Hello` greeting and port `8080`
- [ ] `npm run start:dev` shows `G'day` greeting and port `9090`
- [ ] `config.has('app.theme')` returns `false` — missing key handled cleanly

### Example 2 — Logger

- [ ] `npm start` — text format log lines with full category path visible
- [ ] `npm run start:json-log` — valid JSON log objects with `level`, `message`, `timestamp`, `category`
- [ ] Category-level filtering works: `main` category shows debug; `ROOT` is info
- [ ] `static qualifier` visible in log category name

### Example 3 — CDI

- [ ] `npm start` — `Hello, World!` from `Application.run()`
- [ ] `npm run start:dev` — `G'day, World!` — placeholder `${app.greeting:Hello}` resolves from dev profile
- [ ] Logger autowired with correct category (`static qualifier` path visible in log)
- [ ] `GreetingService shutting down` appears on exit — `destroy()` lifecycle works
- [ ] No application logic in `main.js` — `Application.run()` is the entry point

### Example 4 — Boot

- [ ] `npm start` — banner prints, `Hello, World!`, single destroy line
- [ ] `npm run start:dev` — `G'day, World!`, debug log from `GreetingRepository.init()`
- [ ] `npm run start:json-log` — JSON log lines, banner still shows (banner bypasses log format)
- [ ] `main.js` is ≤10 meaningful lines
- [ ] Banner version matches installed package (`3.0.4`)

### Framework correctness

- [ ] Placeholder `'${app.greeting:Hello}'` resolves correctly with string default (not JSON-parsed)
- [ ] `static qualifier` used on all service classes
- [ ] Banner printed from `Boot.boot()`, not `ApplicationContext`
- [ ] `Boot.boot({ config, contexts })` starts the full lifecycle in one call

---

## Feedback Notes

> _(Add observations, issues, or suggestions before signing off)_

---

## Sign-Off

- [ ] **I have run all four examples and all checklist items above are satisfied.**

  Signed off by: __________________ Date: __________________
