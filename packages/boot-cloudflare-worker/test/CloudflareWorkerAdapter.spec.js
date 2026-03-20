import { assert } from 'chai';
import { EphemeralConfig } from '@alt-javascript/config';
import { ApplicationContext } from '@alt-javascript/cdi';
import { Context } from '@alt-javascript/cdi/context/index.js';
import { jsdbcAutoConfiguration } from '@alt-javascript/jsdbc-template';
import '@alt-javascript/jsdbc-sqljs';
import { createWorkerHandler, CloudflareWorkerAdapter } from '../index.js';

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

class EnvAccessController {
  static __routes = [
    { method: 'GET', path: '/env-test', handler: 'test' },
  ];
  async test(request) {
    return { secret: request.env.MY_SECRET, hasCtx: !!request.ctx };
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

function webRequest(url, options = {}) {
  return new Request(`http://localhost${url}`, options);
}

async function buildAdapter(extras = [], configOverrides = {}) {
  const config = new EphemeralConfig(configOverrides);
  const context = new Context([
    { Reference: GreetingService, name: 'greetingService', scope: 'singleton' },
    { Reference: GreetingController, name: 'greetingController', scope: 'singleton' },
    { Reference: EnvAccessController, name: 'envAccessController', scope: 'singleton' },
    ...extras,
  ]);
  const appCtx = new ApplicationContext({ contexts: [context], config });
  await appCtx.start({ run: false });
  return new CloudflareWorkerAdapter(appCtx);
}

describe('Cloudflare Worker Adapter', () => {
  describe('route dispatch', () => {
    it('GET route returns service data', async () => {
      const adapter = await buildAdapter();
      const res = await adapter.fetch(webRequest('/greet/Alice'));
      assert.equal(res.status, 200);
      assert.deepEqual(await res.json(), { message: 'Hello, Alice!' });
    });

    it('POST route with JSON body', async () => {
      const adapter = await buildAdapter();
      const res = await adapter.fetch(webRequest('/echo', {
        method: 'POST',
        body: JSON.stringify({ key: 'value' }),
        headers: { 'Content-Type': 'application/json' },
      }));
      assert.equal(res.status, 200);
      assert.deepEqual(await res.json(), { received: { key: 'value' } });
    });

    it('health endpoint', async () => {
      const adapter = await buildAdapter();
      const res = await adapter.fetch(webRequest('/health'));
      assert.equal(res.status, 200);
      assert.deepEqual(await res.json(), { status: 'ok' });
    });

    it('returns 404 for unregistered routes', async () => {
      const adapter = await buildAdapter();
      const res = await adapter.fetch(webRequest('/nonexistent'));
      assert.equal(res.status, 404);
    });
  });

  describe('env bindings', () => {
    it('passes env to request for secret/binding access', async () => {
      const adapter = await buildAdapter();
      const res = await adapter.fetch(
        webRequest('/env-test'),
        { MY_SECRET: 's3cret' },
      );
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.secret, 's3cret');
      assert.equal(body.hasCtx, true);
    });
  });

  describe('createWorkerHandler', () => {
    it('boots CDI and handles fetch events', async () => {
      const config = new EphemeralConfig({});
      const context = new Context([
        { Reference: GreetingService, name: 'greetingService', scope: 'singleton' },
        { Reference: GreetingController, name: 'greetingController', scope: 'singleton' },
      ]);
      const handler = createWorkerHandler({ contexts: [context], config });

      const res = await handler(webRequest('/greet/Worker'), {}, {});
      assert.equal(res.status, 200);
      assert.deepEqual(await res.json(), { message: 'Hello, Worker!' });
    });

    it('reuses context on subsequent requests', async () => {
      const config = new EphemeralConfig({});
      const context = new Context([
        { Reference: GreetingService, name: 'greetingService', scope: 'singleton' },
        { Reference: GreetingController, name: 'greetingController', scope: 'singleton' },
      ]);
      const handler = createWorkerHandler({ contexts: [context], config });

      const res1 = await handler(webRequest('/health'), {}, {});
      assert.equal(res1.status, 200);
      const res2 = await handler(webRequest('/health'), {}, {});
      assert.equal(res2.status, 200);
    });
  });

  describe('JSDBC integration', () => {
    it('full stack: Worker → controller → service → JSDBC', async () => {
      const adapter = await buildAdapter(
        [
          ...jsdbcAutoConfiguration(),
          { Reference: TodoService, name: 'todoService', scope: 'singleton' },
          { Reference: TodoController, name: 'todoController', scope: 'singleton' },
        ],
        { jsdbc: { url: 'jsdbc:sqljs:memory' } },
      );
      await adapter.applicationContext.get('todoService').createTable();

      let res = await adapter.fetch(webRequest('/todos'));
      assert.equal(res.status, 200);
      assert.deepEqual(await res.json(), []);

      res = await adapter.fetch(webRequest('/todos', {
        method: 'POST',
        body: JSON.stringify({ title: 'Buy milk' }),
        headers: { 'Content-Type': 'application/json' },
      }));
      assert.equal(res.status, 201);
      assert.equal((await res.json()).title, 'Buy milk');

      res = await adapter.fetch(webRequest('/todos'));
      assert.equal((await res.json()).length, 1);
    });
  });
});
