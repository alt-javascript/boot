# S01: Core Pipeline \u2014 MiddlewarePipeline compose utility — UAT

**Milestone:** M013
**Written:** 2026-03-26T11:50:52.825Z

## UAT — S01: Core Pipeline\n\n### Test: compose short-circuit\n```js\nconst blocker = { handle: async () => ({ statusCode: 401 }) };\nconst pipeline = MiddlewarePipeline.compose([blocker], () => ({ statusCode: 200 }));\nconst result = await pipeline({});\nassert.equal(result.statusCode, 401);\n// handler never called\n```\n\n### Test: collect sorts by order\n```js\nconst result = MiddlewarePipeline.collect(ctx); // A.order=30, B.order=10, C.order=20\nassert.instanceOf(result[0], B); // 10\nassert.instanceOf(result[1], C); // 20\nassert.instanceOf(result[2], A); // 30\n```\n\n**Status:** ✅ All 13 unit tests passing
