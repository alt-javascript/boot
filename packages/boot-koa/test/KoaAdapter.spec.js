import { assert } from 'chai';
import supertest from 'supertest';
import { EphemeralConfig } from '@alt-javascript/config';
import { ApplicationContext } from '@alt-javascript/cdi';
import { Context } from '@alt-javascript/cdi/context/index.js';
import { jsdbcAutoConfiguration } from '@alt-javascript/jsdbc-template';
import '@alt-javascript/jsdbc-sqljs';
import { koaStarter, KoaAdapter } from '../index.js';

// --- Service ---
class GreetingService {
  greet(name) { return `Hello, ${name}!`; }
}

// --- Controller ---
class GreetingController {
  static __routes = [
    { method: 'GET', path: '/greet/:name', handler: 'greet' },
    { method: 'GET', path: '/health', handler: 'health' },
    { method: 'POST', path: '/echo', handler: 'echo' },
  ];
  constructor() { this.greetingService = null; }
  async greet(request) { return { message: this.greetingService.greet(request.params.name) }; }
  async health() { return { status: 'ok' }; }
  async echo(request) { return { received: request.body }; }
}

// --- Imperative controller ---
class ImperativeController {
  routes(router, ctx) {
    router.set('GET /imperative', {
      handler: async (request) => {
        const svc = request.ctx.get('greetingService');
        return { from: 'imperative', greeting: svc.greet('world') };
      },
    });
  }
}

// --- TodoService for JSDBC integration ---
class TodoService {
  constructor() { this.jsdbcTemplate = null; }
  async createTable() {
    await this.jsdbcTemplate.execute(
      'CREATE TABLE IF NOT EXISTS todos (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, done INTEGER DEFAULT 0)',
    );
  }
  async findAll() { return this.jsdbcTemplate.queryForList('SELECT * FROM todos'); }
  async create(title) {
    await this.jsdbcTemplate.update('INSERT INTO todos (title) VALUES (?)', [title]);
    return this.jsdbcTemplate.queryForObject('SELECT * FROM todos WHERE id = (SELECT MAX(id) FROM todos)');
  }
}

class TodoController {
  static __routes = [
    { method: 'GET', path: '/todos', handler: 'list' },
    { method: 'POST', path: '/todos', handler: 'create' },
  ];
  constructor() { this.todoService = null; }
  async list() { return this.todoService.findAll(); }
  async create(request) {
    const todo = await this.todoService.create(request.body.title);
    return { statusCode: 201, body: todo };
  }
}

// --- Helpers ---
async function buildContext(extras = [], configOverrides = {}) {
  const config = new EphemeralConfig({ server: { port: 0 }, ...configOverrides });
  const context = new Context([
    ...koaStarter(),
    { Reference: GreetingService, name: 'greetingService', scope: 'singleton' },
    { Reference: GreetingController, name: 'greetingController', scope: 'singleton' },
    { Reference: ImperativeController, name: 'imperativeController', scope: 'singleton' },
    ...extras,
  ]);
  const appCtx = new ApplicationContext({ contexts: [context], config });
  await appCtx.start({ run: false });
  return appCtx;
}

describe('Koa Adapter', () => {
  let appCtx;
  afterEach(() => {
    if (appCtx) {
      const a = appCtx.get('koaAdapter', null);
      if (a && typeof a.destroy === 'function') a.destroy();
    }
  });

  describe('boot lifecycle', () => {
    it('creates a Koa app via auto-configuration', async () => {
      appCtx = await buildContext();
      const adapter = appCtx.get('koaAdapter');
      assert.instanceOf(adapter, KoaAdapter);
      assert.exists(adapter.app);
    });

    it('reads server.port from config', async () => {
      appCtx = await buildContext([], { server: { port: 8888 } });
      assert.equal(appCtx.get('koaAdapter')._port, 8888);
    });
  });

  describe('controller auto-registration', () => {
    it('GET route returns service data', async () => {
      appCtx = await buildContext();
      const res = await supertest(appCtx.get('koaAdapter').app.callback())
        .get('/greet/Alice').expect(200);
      assert.deepEqual(res.body, { message: 'Hello, Alice!' });
    });

    it('POST route with JSON body', async () => {
      appCtx = await buildContext();
      const res = await supertest(appCtx.get('koaAdapter').app.callback())
        .post('/echo').send({ key: 'value' }).expect(200);
      assert.deepEqual(res.body, { received: { key: 'value' } });
    });

    it('health endpoint', async () => {
      appCtx = await buildContext();
      const res = await supertest(appCtx.get('koaAdapter').app.callback())
        .get('/health').expect(200);
      assert.deepEqual(res.body, { status: 'ok' });
    });

    it('returns 404 for unregistered routes', async () => {
      appCtx = await buildContext();
      await supertest(appCtx.get('koaAdapter').app.callback())
        .get('/nonexistent').expect(404);
    });
  });

  describe('imperative routes()', () => {
    it('registers via routes(router, ctx)', async () => {
      appCtx = await buildContext();
      const res = await supertest(appCtx.get('koaAdapter').app.callback())
        .get('/imperative').expect(200);
      assert.deepEqual(res.body, { from: 'imperative', greeting: 'Hello, world!' });
    });
  });

  describe('DI wiring', () => {
    it('autowires service into controller', async () => {
      appCtx = await buildContext();
      assert.instanceOf(appCtx.get('greetingController').greetingService, GreetingService);
    });
  });

  describe('JSDBC integration', () => {
    it('full stack: Koa → controller → service → JSDBC', async () => {
      appCtx = await buildContext(
        [
          ...jsdbcAutoConfiguration(),
          { Reference: TodoService, name: 'todoService', scope: 'singleton' },
          { Reference: TodoController, name: 'todoController', scope: 'singleton' },
        ],
        { jsdbc: { url: 'jsdbc:sqljs:memory' } },
      );
      await appCtx.get('todoService').createTable();
      const cb = appCtx.get('koaAdapter').app.callback();

      let res = await supertest(cb).get('/todos').expect(200);
      assert.deepEqual(res.body, []);

      res = await supertest(cb).post('/todos').send({ title: 'Buy milk' }).expect(201);
      assert.equal(res.body.title, 'Buy milk');

      res = await supertest(cb).get('/todos').expect(200);
      assert.equal(res.body.length, 1);
    });
  });
});
