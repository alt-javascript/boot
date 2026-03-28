# M006: M006: Web / MVC Binding — Framework Integration with Express and Fastify

## Vision
Developers boot Express or Fastify with one adapter call and get CDI-managed services, config, logging, and lifecycle — while writing idiomatic Express/Fastify code. Application logic lives in framework-agnostic CDI beans; only the HTTP surface touches the framework.

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | Express Adapter + Controller Convention | high | — | ✅ | An Express app boots via ApplicationContext with CDI-managed services, route handlers access beans, controllers auto-register routes — proven by tests using supertest |
| S02 | Fastify Adapter | medium | S01 | ✅ | The same service layer from S01 runs behind Fastify with a different adapter — proven by tests using fastify.inject() |
| S03 | Example Apps + JSDBC Integration | low | S01, S02 | ✅ | Two working example applications (Express + Fastify) serve JSDBC-backed REST endpoints, demonstrating the full stack: boot → config → CDI → JSDBC → HTTP — verified by running the apps and hitting endpoints |
| S04 | AWS Lambda Adapter | medium | S01 | ✅ | Same service layer runs serverless on AWS Lambda, CDI boots once on cold start, API Gateway HTTP API v2 events dispatch to controller methods via __routes — proven by direct handler invocation tests + JSDBC integration |
| S05 | Koa Adapter | low | S01 | ✅ | Same service layer runs behind Koa (Express team's async successor) — proven by tests using supertest against Koa's callback() |
| S06 | Hono Adapter | medium | S01 | ✅ | Same service layer runs behind Hono (Web Standards Request/Response API) — proven by tests using Hono's app.request() test helper |
| S07 | Cloudflare Workers Adapter | low | S04 | ✅ | Same service layer runs on Cloudflare Workers — proven by simulating the fetch(request, env, ctx) handler shape with CDI-managed services |
| S08 | Azure Functions Adapter | low | S04 | ✅ | Same service layer runs on Azure Functions v4 — proven by simulating the (request, context) handler shape with CDI-managed services |
