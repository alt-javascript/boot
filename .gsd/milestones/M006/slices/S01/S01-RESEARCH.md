# S01 Research: Express Adapter + Controller Convention

## Historical Context: Spring's DispatcherServlet Evolution

Spring Framework was born as a reaction to J2EE complexity (EJB, servlet specs). Early Spring versions injected into the servlet container via `DispatcherServlet` — a front controller that delegated to Spring-managed beans. The framework co-resided with other servlets. Spring Boot inverted this: the servlet container (Tomcat, Jetty) became a managed dependency configured by Spring, making the container choice nearly invisible.

**In JavaScript, the inversion already exists.** Express and Fastify aren't runtime containers — they're npm packages. There's no "servlet container" to inject into. The question is how to complement the framework's existing ergonomics.

## The Ergonomic Tension

Express and Fastify have strong, self-evident ergonomics:

```javascript
// Express — 4 lines to hello world
const app = express();
app.get('/', (req, res) => res.send('Hello'));
app.listen(3000);
```

Developers chose these frameworks *because* of this simplicity. Any DI/IoC layer that gets in the way will be rejected. The goal is **not** to replace these ergonomics but to complement them with:

1. **Service layer separation** — business logic in CDI beans, not route handlers
2. **Config externalisation** — server properties from config, not hardcoded
3. **Cross-cutting concerns** — logging, transactions, AOP at the service layer
4. **Lifecycle management** — clean startup/shutdown with dependency ordering

## The Problem We're Actually Solving

When Express/Fastify apps grow, the code tends toward:

```javascript
// Typical "fat handler" anti-pattern
app.post('/users', async (req, res) => {
  const { name, email } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.query('INSERT INTO users ...');
    await conn.query('INSERT INTO audit_log ...');
    await sendWelcomeEmail(email);  // side effect mixed in
    res.json({ ok: true });
  } finally {
    conn.release();
  }
});
```

The CDI container provides the architectural defence:

```javascript
// Route handler is thin — just HTTP translation
app.post('/users', async (req, res) => {
  const result = await ctx.get('userService').createUser(req.body);
  res.status(201).json(result);
});

// Application logic is testable, portable, framework-agnostic
class UserService {
  constructor() {
    this.jsdbcTemplate = null;  // autowired
    this.emailService = null;   // autowired
    this.auditService = null;   // autowired
  }
  async createUser({ name, email }) { ... }
}
```

## Design Decision: Complement, Don't Replace

The adapter should be a **thin bridge** that:
1. Creates the framework instance as a CDI-managed singleton
2. Makes the ApplicationContext accessible from route handlers
3. Provides an optional controller convention for route auto-registration
4. Manages lifecycle (start/shutdown)

The developer still writes Express/Fastify code. They still use middleware/plugins. They just get their services from the CDI container.

## Controller Convention: `__routes` Static Metadata

Without decorators, the most JS-idiomatic approach is static metadata (same pattern as `__component`):

```javascript
class UserController {
  static __component = true;
  static __routes = [
    { method: 'GET',    path: '/users',     handler: 'list' },
    { method: 'GET',    path: '/users/:id', handler: 'getById' },
    { method: 'POST',   path: '/users',     handler: 'create' },
    { method: 'PUT',    path: '/users/:id', handler: 'update' },
    { method: 'DELETE', path: '/users/:id', handler: 'remove' },
  ];

  constructor() {
    this.userService = null; // autowired
  }

  async list(req, res) { ... }
  async getById(req, res) { ... }
  async create(req, res) { ... }
}
```

**Pros:** Declarative, scannable, no runtime overhead, familiar to Spring developers.
**Cons:** Framework-coupled (req/res signature differs between Express and Fastify).

**Mitigation:** Controllers can be framework-specific (thin HTTP translation layer). The service layer below is framework-agnostic. This mirrors Spring's `@RestController` — the controller knows about HTTP, the service doesn't.

## Alternative: Registry-Based Routes

```javascript
class UserController {
  static __component = true;
  constructor() { this.userService = null; }

  routes(router) {
    router.get('/users', (req, res) => this.list(req, res));
    router.post('/users', (req, res) => this.create(req, res));
  }
}
```

**Pros:** Maximum framework fidelity — uses native router API.
**Cons:** No metadata to scan; harder to inspect/document routes.

**Decision:** Support both. `__routes` for declarative, `routes(router)` for imperative. The adapter scans for both during controller registration.

## Context Propagation

How do route handlers access CDI beans?

| Approach | Express | Fastify | Assessment |
|---|---|---|---|
| `req.ctx` | middleware sets it | hook sets it | Per-request overhead, familiar |
| `app.locals.ctx` | native Express | Fastify `decorate` | One-time setup, no per-request cost |
| Closure capture | `app.get('/', (req, res) => ctx.get(...))` | same | Works but couples route defs to scope |
| Module-level export | `export const ctx = ...` | same | Global state, hard to test |

**Decision:** Use `app.locals.ctx` (Express) / `fastify.ctx` via `decorate` (Fastify) for the context reference. Zero per-request overhead. Optionally set `req.ctx` via middleware for convenience.

## Existing 2.x Demo Analysis

The 2.x demos (`boot-demo-express-hello-world`, `boot-demo-fastify-hello-world`) prove the basic model works:
- Express/Fastify instance created as CDI prototype factory
- Server class is a CDI singleton with config-injected port
- `init()` registers routes, `run()` starts listening, `destroy()` closes

What's missing from 2.x:
- No reusable adapter package (hand-coded per project)
- No controller convention (routes defined in `Server.init()`)
- No auto-configuration function
- No context propagation pattern
- CommonJS (needs ESM migration)
- No test coverage of the HTTP layer

## Middleware vs AOP

Express middleware and Fastify hooks/plugins serve cross-cutting concerns at the HTTP layer. CDI AOP (`createProxy`) serves them at the service layer.

**These don't compete — they complement:**
- HTTP concerns (auth headers, CORS, rate limiting, request logging) → framework middleware/plugins
- Application concerns (transaction boundaries, audit logging, caching) → CDI AOP

The adapter should not try to bridge these. Each operates in its own domain.

## Test Strategy

- **Express:** `supertest` for in-process HTTP testing — no server.listen() needed
- **Fastify:** `fastify.inject()` for in-process request injection — built-in, no extra dependency
- Both allow testing the full request pipeline without opening network ports
