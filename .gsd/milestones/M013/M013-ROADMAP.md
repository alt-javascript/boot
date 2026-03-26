# M013: 

## Vision
Introduce a single, framework-agnostic middleware pipeline that threads cross-cutting concerns — authentication, observability, error handling, and custom 404 — across all 7 server and serverless adapters through the same CDI component convention already used for controllers. Zero changes to controller code; zero new framework dependencies.

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | Core Pipeline — MiddlewarePipeline compose utility | low | — | ✅ | MiddlewarePipeline.compose([auth, logger, notFound])(request) returns 401 when auth rejects, calls logger and notFound only when auth passes |
| S02 | Built-in Middleware — Logger, ErrorHandler, NotFound | low | S01 | ✅ | expressStarter() returns component list including requestLoggerMiddleware, errorHandlerMiddleware, notFoundMiddleware |
| S03 | Serverless Adapters — Lambda, CF Workers, Azure Fn | medium | S01, S02 | ✅ | Lambda test: POST /protected without auth header → 401 from AuthMiddleware before handler fires |
| S04 | Server Adapters — Express, Fastify, Koa, Hono | medium | S01, S02 | ✅ | Express integration test: GET /secret without Authorization → 401; GET /unknown → 404 JSON; handler throw → 500 JSON |
| S05 | Examples — Auth + Logging + Error Handling end-to-end | low | S03, S04 | ✅ | README snippet showing a 10-line AuthMiddleware CDI component; curl output confirming 401/404/500 responses |
