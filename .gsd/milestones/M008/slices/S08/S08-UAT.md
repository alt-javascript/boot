# S08 UAT — Cloudflare Worker Example

**Status:** Ready for human sign-off

---

## Package

`packages/example-3-3-servers-cloudflare-worker`

## What this demonstrates

- `cloudflareWorkerStarter()` — registers `CloudflareWorkerAdapter` CDI singleton
- `Boot.boot({ contexts, run: false })` — same idiom as Lambda and Azure; skips run phase
- `static __routes` — same convention; path params use `:name`
- Worker returns Web Standards `Response` objects (not `{ statusCode, body }`)
- Unit-testable with Node.js globals — no Wrangler, no Miniflare required
- Local invoke harness: `npm run invoke` using `new Request(url)`
- `export default { fetch }` — Cloudflare Workers v2 module syntax

## How to run

```bash
cd packages/example-3-3-servers-cloudflare-worker

# Unit tests (no Wrangler required)
npm test

# Local invoke harness
npm run invoke        # Hello greeting (default profile)
npm run invoke:dev    # G'day greeting (dev profile)
```

## Expected output

```
# npm run invoke
GET /health [200] {"status":"ok","app":"Cloudflare Worker Example","version":"1.0.0"}
GET /greet/World [200] {"message":"Hello, World!"}
GET /greet/CF [200] {"message":"Hello, CF!"}
GET /missing [404] {"error":"Not found: GET /missing"}
```

## Evidence from implementation run

- 5/5 unit tests pass
- invoke harness: all 4 routes return expected responses
- CDI boots once: GreetingService init log appears once across warm calls

---

## Acceptance Checklist

- [x] `npm test` — 5 tests pass
- [x] `npm run invoke` — health, greet/World, greet/CF return 200; /missing returns 404
- [x] `npm run invoke:dev` — greeting changes to `G'day`
- [x] CDI boots once (GreetingService init log appears once)
- [x] `worker.js` uses `export default { fetch }` — Cloudflare module syntax
- [x] Uses `Boot.boot({ contexts, run: false })` — same idiom as Lambda and Azure

---

## Feedback Notes

> _(Add observations, issues, or suggestions before signing off)_

---

## Sign-Off

- [x] **I have run the example and all checklist items above are satisfied.**

  Signed off by: craigparra Date: 2026-043-24   
