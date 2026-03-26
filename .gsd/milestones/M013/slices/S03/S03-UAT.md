# S03: Serverless Adapters \u2014 Lambda, CF Workers, Azure Fn — UAT

**Milestone:** M013
**Written:** 2026-03-26T12:00:58.004Z

## UAT — S03: Serverless Adapters\n\n### Lambda\n- ✅ GET /greet/{name} → 200 with service response\n- ✅ Unknown route → 404 from NotFoundMiddleware\n- ✅ Handler throw → 500 from ErrorHandlerMiddleware\n- ✅ Missing routeKey → 400 (pre-pipeline guard)\n- ✅ 32 tests passing including JSDBC integration\n\n### Azure Functions\n- ✅ Route dispatch works\n- ✅ 404 for unregistered routes\n- ✅ 8 tests passing\n\n### Cloudflare Workers\n- ✅ Route dispatch works\n- ✅ 404 for unregistered routes\n- ✅ 204/304 null body (undici compliance)\n- ✅ 8 tests passing
