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

- [x] `npm start` shows `Hello` greeting and port `8080`
- [x] `npm run start:dev` shows `G'day` greeting and port `9090`
- [x] `config.has('app.theme')` returns `false` — missing key handled cleanly

### Example 2 — Logger

- [x] `npm start` — text format log lines with full category path visible
- [x] `npm run start:json-log` — valid JSON log objects with `level`, `message`, `timestamp`, `category`
- [x] Category-level filtering works: `main` category shows debug; `ROOT` is info
- [x] `static qualifier` visible in log category name

### Example 3 — CDI

- [x] `npm start` — `Hello, World!` from `Application.run()`
- [x] `npm run start:dev` — `G'day, World!` — placeholder `${app.greeting:Hello}` resolves from dev profile
- [x] Logger autowired with correct category (`static qualifier` path visible in log)
- [x] `GreetingService shutting down` appears on exit — `destroy()` lifecycle works
- [x] No application logic in `main.js` — `Application.run()` is the entry point

### Example 4 — Boot

- [x] `npm start` — banner prints, `Hello, World!`, single destroy line
- [x] `npm run start:dev` — `G'day, World!`, debug log from `GreetingRepository.init()`
- [x] `npm run start:json-log` — JSON log lines, banner still shows (banner bypasses log format)
- [X] `main.js` is ≤10 meaningful lines
- [x] Banner version matches installed package (`3.0.4`)

### Framework correctness

- [x] Placeholder `'${app.greeting:Hello}'` resolves correctly with string default (not JSON-parsed)
- [x] `static qualifier` used on all service classes
- [x] Banner printed from `Boot.boot()`, not `ApplicationContext`
- [x] `Boot.boot({ config, contexts })` starts the full lifecycle in one call

---

## Feedback Notes

> _(Add observations, issues, or suggestions before signing off)_

I have made code changes to address the "semantic drift" in the framework ergonimics created by the
automatic refactoring process.  Note the code changes (not-commited) outlined below, commit and
update documentation to reflect the differences.

### Example 1 — Config

The config package now uses ProfileConfigLoader.load() as the default config, inside 
the ConfigFactory method, so that it is enhanced with placeholder resolution, etc.

This is defaulted importing config in the examples, so the ProfileConfigLoader.load()
lines are removed (boilerplate)

The example should show all three formats; I converted application.json to application.properties, leave
application-dev.json, and add a yaml example.

The ProfileConfigLoader.load() also looks in the present working directory for files,  
I moved application.properties into the top level directory as an example.


### Example 3 & 4 — CDI & Boot

Example 3 (and by extension 4) had framework structural problems, and poorly separated concerns, 
left over from on the previous 2x design;  the CDI package no longer detects and injects anything 
from the globalRef, and excludes the common package imports. In cdi only uses
everything is left to the developer. 
The loggerFactory, loggerFactoryCache and config are not added to the ApplicationContext if
they are defaulted (by design) -- to do this the developer must create them manually first,
add them manually to the contexts array, and provide them all in the constructor.

This is now the work that the boot module, and Boot.boot() does.  Boot.boot() still adds
a root context to the globalRef but only as a convenience.  Rather than the globals
being detected by CDI (breaking the concern separation), it is explicity pushed into 
the provided array of contexts, doing the manual wiring work the developer must handle
when using CDI alone.

### Add a new example for cdi advanced

I have renamed the examples:

example-1-1-intro-config
example-1-2-intro-logger
example-1-3-intro-cdi
example-1-5-intro-boot

Add a new module showing the advanced CDI features example-1-4-intro-cdi-advanced to demonstrate the 
advanced features and add a UAT section for sign off.

---

## Sign-Off

- [ ] **I have run all four examples and all checklist items above are satisfied.**

  Signed off by: __________________ Date: __________________
