# S06 UAT — AWS Lambda Example

**Status:** Ready for human sign-off

---

## Package

`packages/example-3-1-servers-lambda`

## What this demonstrates

- `createLambdaHandler({ contexts })` — boots CDI once on cold start, reuses on warm invocations
- `static __routes` — same convention; path params use `{name}` (API Gateway style, not `:name`)
- No `Boot.boot()` — Lambda manages its own lifecycle; handler exports a function
- Handlers return plain objects — `LambdaAdapter` serialises to `{ statusCode, body, headers }`
- Unit-testable without AWS account: `handler(event, {})` directly
- Local invoke harness: `npm run invoke` simulates API Gateway v2 events

## How to run

```bash
cd packages/example-3-1-servers-lambda

# Unit tests (no AWS required)
npm test

# Local invoke harness — simulates API Gateway v2 events
npm run invoke        # Hello greeting (default profile)
npm run invoke:dev    # G'day greeting (dev profile)
```

## Expected output

```
# npm run invoke
GET /health [200] {"status":"ok","app":"Lambda Example","version":"1.0.0"}
GET /greet/World [200] {"message":"Hello, World!"}
GET /greet/Lambda [200] {"message":"Hello, Lambda!"}
GET /missing [404] {"error":"No route matches: GET /missing"}

# npm run invoke:dev
GET /greet/World [200] {"message":"G'day, World!"}
```

## Evidence from implementation run

- 5/5 unit tests pass
- invoke harness: all 4 routes return expected responses
- CDI boots once: GreetingService init log appears once across 5 warm-invocation test calls

---

## Acceptance Checklist

**All boxes must be checked before S07 begins.**

- [ ] `npm test` — 5 tests pass
- [ ] `npm run invoke` — health, greet/World, greet/Lambda return 200; /missing returns 404
- [ ] `npm run invoke:dev` — greeting changes to `G'day`
- [ ] CDI boots once (GreetingService init log appears once, not per-invocation)
- [ ] `handler.js` exports a named `handler` function suitable for AWS Lambda runtime
- [ ] No `Boot.boot()`, no running HTTP server

---

## Feedback Notes

> _(Add observations, issues, or suggestions before signing off)_

It would be better to use the Boot.boot() idiom as per all the other server adapters, so lets
address the Boot.boot() function to allow for that to happen.

Change the `static async boot(context)` signature to `static async boot(options)` to more accurately reflect
that it is options being passed in (context is badly named here, since its not a CDI context, and confuses its intent),
then add a options.run option that defaults to true if anything other than explicitly false or true 
(ie undefined, null), perhaps case insensitive string matches of true or false are ok.

Pass the run option to the AppllicationContext.start() function.

The createLambdaHandler should then be able to use Boot.boot() idiomatically, confirm this will work without
any sideeffects I haven't cuaght before implementing.

Also, change createLambdaHandler to lambdaStatert and deprecate createLambdaHandler.

---

## Sign-Off

- [ ] **I have run the example and all checklist items above are satisfied.**

  Signed off by: __________________ Date: __________________
