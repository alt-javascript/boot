# S04: AWS Lambda Adapter

**Goal:** A reusable `@alt-javascript/boot-lambda` adapter that boots CDI once on cold start, routes API Gateway HTTP API events to controller methods via the same `__routes` convention, and returns Lambda-format responses. Same service layer, completely serverless.
**Demo:** After this: Same service layer runs serverless on AWS Lambda, CDI boots once on cold start, API Gateway HTTP API v2 events dispatch to controller methods via __routes — proven by direct handler invocation tests + JSDBC integration

## Tasks
- [x] **T01: Lambda adapter core + route dispatch** — 
- [x] **T02: Integration test with JSDBC** — 
