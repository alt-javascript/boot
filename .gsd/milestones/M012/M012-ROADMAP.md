# M012: 

## Vision
ProfileConfigLoader discovers *.env files (application.env, application-{profile}.env) alongside existing config formats, parses them with a dedicated DotEnvParser, wraps them as EnvPropertySource so relaxed binding (MY_APP_PORT → my.app.port) works identically to process.env, and slots them between process.env and regular config files in the precedence chain — the standard dotenv convention.

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | DotEnvParser + ProfileConfigLoader .env integration | low | — | ✅ | ProfileConfigLoader.load() resolves values from application.env with relaxed binding; process.env beats .env; profile .env beats base .env; all existing tests still green. |
