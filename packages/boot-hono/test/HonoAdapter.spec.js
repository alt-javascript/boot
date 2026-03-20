import { assert } from 'chai';
import { EphemeralConfig } from '@alt-javascript/config';
import { ApplicationContext } from '@alt-javascript/cdi';
import { Context } from '@alt-javascript/cdi/context/index.js';
import { jsdbcAutoConfiguration } from '@alt-javascript/jsdbc-template';
import '@alt-javascript/jsdbc-sqljs';
import { honoAutoConfiguration, HonoAdapter } from '../index.js';

class GreetingService {
  greet(name) { return `Hello, ${name}!`; }
}

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

class ImperativeController {
  routes(app, ctx) {
    app.get('/imperative', async (c) => {
      const svc = ctx.get('greetingService');
      return c.json({ from: 'imperative', greeting: svc.greet('world') });
    });
  }
}

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

async function buildContext(extras = [], configOverrides = {}) {
  const config = new EphemeralConfig({ server: { port: 0 }, ...configOverrides });
  const context = new Context([
    ...honoAutoConfiguration(),
    { Reference: GreetingService, name: 'greetingService', scope: 'singleton' },
    { Reference: GreetingController, name: 'greetingController', scope: 'singleton' },
    { Reference: ImperativeController, name: 'imperativeController', scope: 'singleton' },
    ...extras,
  ]);
  const appCtx = new ApplicationContext({ contexts: [context], config });
  await appCtx.start({ run: false });
  return appCtx;
}

describe('Hono Adapter', () => {
  let appCtx;
  afterEach(() => { appCtx = null; });

  describe('boot lifecycle', () => {
    it('creates a Hono app via auto-configuration', async () => {
      appCtx = await buildContext();
      assert.instanceOf(appCtx.get('honoAdapter'), HonoAdapter);
      assert.exists(appCtx.get('honoAdapter').app);
    });
  });

  describe('controller auto-registration', () => {
    it('GET route returns service data', async () => {
      appCtx = await buildContext();
      const res = await appCtx.get('honoAdapter').app.request('/greet/Alice');
      assert.equal(res.status, 200);
      assert.deepEqual(await res.json(), { message: 'Hello, Alice!' });
    });

    it('POST route with JSON body', async () => {
      appCtx = await buildContext();
      const res = await appCtx.get('honoAdapter').app.request('/echo', {
        method: 'POST',
        body: JSON.stringify({ key: 'value' }),
        headers: { 'Content-Type': 'application/json' },
      });
      assert.equal(res.status, 200);
      assert.deepEqual(await res.json(), { received: { key: 'value' } });
    });

    it('health endpoint', async () => {
      appCtx = await buildContext();
      const res = await appCtx.get('honoAdapter').app.request('/health');
      assert.equal(res.status, 200);
      assert.deepEqual(await res.json(), { status: 'ok' });
    });

    it('returns 404 for unregistered routes', async () => {
      appCtx = await buildContext();
      const res = await appCtx.get('honoAdapter').app.request('/nonexistent');
      assert.equal(res.status, 404);
    });
  });

  describe('imperative routes()', () => {
    it('registers via routes(app, ctx)', async () => {
      appCtx = await buildContext();
      const res = await appCtx.get('honoAdapter').app.request('/imperative');
      assert.equal(res.status, 200);
      assert.deepEqual(await res.json(), { from: 'imperative', greeting: 'Hello, world!' });
    });
  });

  describe('DI wiring', () => {
    it('autowires service into controller', async () => {
      appCtx = await buildContext();
      assert.instanceOf(appCtx.get('greetingController').greetingService, GreetingService);
    });
  });

  describe('JSDBC integration', () => {
    it('full stack: Hono → controller → service → JSDBC', async () => {
      appCtx = await buildContext(
        [
          ...jsdbcAutoConfiguration(),
          { Reference: TodoService, name: 'todoService', scope: 'singleton' },
          { Reference: TodoController, name: 'todoController', scope: 'singleton' },
        ],
        { jsdbc: { url: 'jsdbc:sqljs:memory' } },
      );
      await appCtx.get('todoService').createTable();
      const app = appCtx.get('honoAdapter').app;

      let res = await app.request('/todos');
      assert.equal(res.status, 200);
      assert.deepEqual(await res.json(), []);

      res = await app.request('/todos', {
        method: 'POST',
        body: JSON.stringify({ title: 'Buy milk' }),
        headers: { 'Content-Type': 'application/json' },
      });
      assert.equal(res.status, 201);
      assert.equal((await res.json()).title, 'Buy milk');

      res = await app.request('/todos');
      assert.equal((await res.json()).length, 1);
    });
  });
});
