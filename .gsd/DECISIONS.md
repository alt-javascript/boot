# Decisions Register

<!-- Append-only. Never edit or remove existing rows.
     To reverse a decision, add a new row that supersedes it.
     Read this file at the start of any planning or research phase. -->

| # | When | Scope | Decision | Choice | Rationale | Revisable? |
|---|------|-------|----------|--------|-----------|------------|
| D001 | M001 | scope | Framework analysis scope | Spring Framework core + Spring Boot core only | User explicitly excluded non-core modules (WebMVC, Data, Security). Focus on IoC, DI, config, logging, lifecycle, events, AOP. | No |
| D002 | M001 | arch | TypeScript stance | Pure JavaScript only | Ideological commitment — isomorphic flat ESM in browser without build step. Differentiator vs InversifyJS/NestJS/tsyringe. | No |
| D003 | M001 | scope | Breaking changes | v3.0 breaking changes acceptable | Primary consumers are author's own projects. Quirks like null-matching autowire and duplicated global-ref code can be redesigned. | No |
| D004 | M001 | scope | Jasypt exclusion | @alt-javascript/jasypt excluded from analysis | Not a formal part of Spring, standalone port, out of scope for core framework work. | No |
| D005 | M001 | arch | Decorator approach | Must work without native decorators | Stage 3 decorators not in JS engines yet (Node 24 Symbol.metadata is undefined). Pure JS constraint means no transpiler fallback. | Yes — when decorators reach Stage 4 and ship in engines |
| D006 | M001/S04 | arch | Monorepo structure | npm workspaces with @alt-javascript/common shared kernel | Prototype proves viability: 8 cross-package tests, eliminates 4 copies of global-ref code, enables coordinated versioning, breaks circular test deps. Each package stays independently publishable. | No |
| D007 | M001/S04 | arch | AOP mechanism | JS Proxy — no subclassing or bytecode generation | Proxy is native, performant for non-hot-path use, and provides clean before/after/around semantics. PoC proves all 5 advice types work. | Yes — if performance benchmarks show issues in hot paths |
| D008 | M001/S04 | arch | Event system | Custom isomorphic event bus (no Node EventEmitter) | Must work in browser ESM. Simple Map-based pub/sub is sufficient and portable. PoC proves typed events, wildcards, lifecycle events. | No |
| D009 | M001/S04 | arch | Auto-discovery mechanism | Static __component class property | Most annotation-like pure JS approach. Co-located with class, no tooling. Consumer provides class array (no filesystem scanning — ESM has no classpath). PoC proves integration with ApplicationContext. | Yes — when native decorators ship, could offer decorator alternative |
| D010 | M002/S01 | arch | Monorepo location | New repo with fresh git history | Clean break for v3.0. No git history baggage from 4 separate repos. Old repos archived. Package names stay the same — only repo structure changes. | No |
| D011 | M005 | arch | JSDBC async model | All-async (Promise-based) | Idiomatic JS, works with all underlying drivers. Sync JDBC model doesn't translate to JS ecosystem. | No |
| D012 | M005 | arch | JSDBC URL scheme | `jsdbc:subprotocol:` mirroring JDBC convention | Familiar to Java devs, extensible, driver self-registration via subprotocol. | No |
| D013 | M005 | arch | JSDBC named params | `:name` syntax (matches Spring) | Spring-familiar, unambiguous, easy to parse. | No |
| D014 | M005 | arch | JSDBC template naming | `JsdbcTemplate` / `NamedParameterJsdbcTemplate` | Own the name — JS port identity, not a fake JDBC. | No |
| D015 | M005 | arch | JSDBC domain boundary | JSDBC repo = core interfaces + drivers only | Template layer belongs in boot/altjs monorepo where it integrates with CDI, config, lifecycle. | No |
| D016 | M005 | arch | JSDBC browser driver | sql.js (Wasm SQLite) | 13.5k stars, broad compat, isomorphic SQL in browser. | No |
| D017 | M005 | arch | JSDBC connection pooling | tarn.js (proven, Knex uses it in production) | Battle-tested, minimal API surface, well-maintained. | No |
| D018 | M005 | arch | JSDBC CI test split | `npm test` = CI-safe; `npm run test:integration` = DB-dependent | pg/mysql/mssql/oracle tests need Docker. CI must pass without them. | No |
| D019 | M006 | arch | Web/MVC adapter philosophy | Complement, don't replace | Thin bridge to Express/Fastify/etc. Same service layer, framework-specific controllers. | No |
| D020 | M006 | arch | Controller convention | Static `__routes` metadata + imperative `routes(router)` | Declarative and imperative both supported. | No |
| D021 | M006 | arch | Context propagation | Framework-native: `app.locals.ctx` (Express), `fastify.decorate('ctx')`, `request.ctx` (all) | Use each framework's idiom, don't fight it. | No |
| D022 | M006 | arch | Lambda cold-start pattern | CDI boots once on first invocation, reuses via closure | Standard Lambda warm-reuse pattern. | No |
| D023 | M006 | arch | Adapter landscape | 7 adapters: Express, Fastify, Koa, Hono, Lambda, CF Workers, Azure Functions | Covers all mainstream JS HTTP targets. Hapi excluded (declining). NestJS/Next.js excluded (different abstraction level). | Yes — add adapters as platforms emerge |
| D024 | M007 | arch | Browser profile resolution | URL-to-profile mapping replaces WindowLocationSelectiveConfig | Declarative `{ profiles: { urls: { 'localhost:8080': 'dev' } } }` — symmetric with server-side NODE_ACTIVE_PROFILES. | No |
| D025 | M007 | arch | Frontend adapter pattern | Framework-native bridges, no runtime dependency on target framework | Vue provide/inject, Alpine store, React Context/hooks, Angular providers. All testable without the framework. | No |
