# S07 UAT — Azure Function Example

**Status:** Ready for human sign-off

---

## Package

`packages/example-3-2-servers-azure-function`

## What this demonstrates

- `azureFunctionStarter()` — registers `AzureFunctionAdapter` CDI singleton
- `Boot.boot({ contexts, run: false })` — same idiom as Lambda; skips run phase
- `static __routes` — same convention; path params use `:name` (URL-based routing)
- Handlers return plain objects — adapter wraps in `{ status, jsonBody }`
- Unit-testable without Azure account: `handler(request, {})` directly
- Local invoke harness: `npm run invoke`

## How to run

```bash
cd packages/example-3-2-servers-azure-function

# Unit tests (no Azure required)
npm test

# Local invoke harness
npm run invoke        # Hello greeting (default profile)
npm run invoke:dev    # G'day greeting (dev profile)
```

## Expected output

```
# npm run invoke
GET /health [200] {"status":"ok","app":"Azure Function Example","version":"1.0.0"}
GET /greet/World [200] {"message":"Hello, World!"}
GET /greet/Azure [200] {"message":"Hello, Azure!"}
GET /missing [404] {"error":"Not found: GET /missing"}
```

## Evidence from implementation run

- 5/5 unit tests pass
- invoke harness: all 4 routes return expected responses
- CDI boots once: GreetingService init log appears once across warm calls

---

## Acceptance Checklist

- [ ] `npm test` — 5 tests pass
- [ ] `npm run invoke` — health, greet/World, greet/Azure return 200; /missing returns 404
- [ ] `npm run invoke:dev` — greeting changes to `G'day`
- [ ] CDI boots once (GreetingService init log appears once)
- [ ] `handler.js` exports a named `handler` function
- [ ] Uses `Boot.boot({ contexts, run: false })` — same idiom as Lambda

---

## Feedback Notes

> _(Add observations, issues, or suggestions before signing off)_

---

## Sign-Off

- [ ] **I have run the example and all checklist items above are satisfied.**

  Signed off by: __________________ Date: __________________
