/**
 * Integration test: Lambda + JSDBC full-stack.
 *
 * Proves: boot → config → CDI → JSDBC (sql.js in-memory) → Lambda → API Gateway response
 *
 * Same TodoService as Express and Fastify integration tests — proves the
 * service layer is framework-agnostic across server and serverless.
 */
import { assert } from 'chai';
import { EphemeralConfig } from '@alt-javascript/config';
import { ApplicationContext } from '@alt-javascript/cdi';
import { Context } from '@alt-javascript/cdi/context/index.js';
import { jsdbcAutoConfiguration } from '@alt-javascript/jsdbc-template';
import '@alt-javascript/jsdbc-sqljs'; // self-registers SqlJs driver
import { lambdaAutoConfiguration } from '../index.js';

// -- Domain: TodoService (identical to Express/Fastify tests) --

class TodoService {
  constructor() {
    this.jsdbcTemplate = null; // autowired
  }

  async createTable() {
    await this.jsdbcTemplate.execute(
      'CREATE TABLE IF NOT EXISTS todos (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, done INTEGER DEFAULT 0)',
    );
  }

  async findAll() {
    return this.jsdbcTemplate.queryForList('SELECT * FROM todos');
  }

  async findById(id) {
    return this.jsdbcTemplate.queryForObject('SELECT * FROM todos WHERE id = ?', [id]);
  }

  async create(title) {
    await this.jsdbcTemplate.update('INSERT INTO todos (title) VALUES (?)', [title]);
    return this.jsdbcTemplate.queryForObject(
      'SELECT * FROM todos WHERE id = (SELECT MAX(id) FROM todos)',
    );
  }

  async toggleDone(id) {
    await this.jsdbcTemplate.update(
      'UPDATE todos SET done = CASE WHEN done = 0 THEN 1 ELSE 0 END WHERE id = ?',
      [id],
    );
    return this.findById(id);
  }

  async remove(id) {
    return this.jsdbcTemplate.update('DELETE FROM todos WHERE id = ?', [id]);
  }
}

// -- Controller: TodoController (Lambda-specific) --

class TodoController {
  static __routes = [
    { method: 'GET', path: '/todos', handler: 'list' },
    { method: 'GET', path: '/todos/{id}', handler: 'getById' },
    { method: 'POST', path: '/todos', handler: 'create' },
    { method: 'PUT', path: '/todos/{id}/toggle', handler: 'toggle' },
    { method: 'DELETE', path: '/todos/{id}', handler: 'remove' },
  ];

  constructor() {
    this.todoService = null; // autowired
  }

  async list() {
    return this.todoService.findAll();
  }

  async getById(request) {
    try {
      return await this.todoService.findById(Number(request.params.id));
    } catch {
      return { statusCode: 404, body: { error: 'Not found' } };
    }
  }

  async create(request) {
    const todo = await this.todoService.create(request.body.title);
    return { statusCode: 201, body: todo };
  }

  async toggle(request) {
    return this.todoService.toggleDone(Number(request.params.id));
  }

  async remove(request) {
    await this.todoService.remove(Number(request.params.id));
    return null; // 204
  }
}

// -- Helper --

function apiEvent(routeKey, overrides = {}) {
  return {
    routeKey,
    pathParameters: {},
    queryStringParameters: {},
    headers: { 'content-type': 'application/json' },
    body: null,
    isBase64Encoded: false,
    ...overrides,
  };
}

async function buildFullStack() {
  const config = new EphemeralConfig({
    jsdbc: { url: 'jsdbc:sqljs:memory' },
  });

  const context = new Context([
    ...lambdaAutoConfiguration(),
    ...jsdbcAutoConfiguration(),
    { Reference: TodoService, name: 'todoService', scope: 'singleton' },
    { Reference: TodoController, name: 'todoController', scope: 'singleton' },
  ]);

  const appCtx = new ApplicationContext({ contexts: [context], config });
  await appCtx.start({ run: false });
  return appCtx;
}

describe('Lambda + JSDBC Integration', () => {
  let appCtx;
  let adapter;

  before(async () => {
    appCtx = await buildFullStack();
    adapter = appCtx.get('lambdaAdapter');
    await appCtx.get('todoService').createTable();
  });

  after(async () => {
    const ds = appCtx.get('dataSource');
    if (ds && typeof ds.destroy === 'function') await ds.destroy();
  });

  it('GET /todos returns empty list initially', async () => {
    const res = await adapter.handle(apiEvent('GET /todos'));
    assert.equal(res.statusCode, 200);
    assert.deepEqual(JSON.parse(res.body), []);
  });

  it('POST /todos creates a todo', async () => {
    const res = await adapter.handle(
      apiEvent('POST /todos', { body: JSON.stringify({ title: 'Buy milk' }) }),
    );
    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.equal(body.title, 'Buy milk');
    assert.equal(body.done, 0);
    assert.exists(body.id);
  });

  it('GET /todos returns the created todo', async () => {
    const res = await adapter.handle(apiEvent('GET /todos'));
    const body = JSON.parse(res.body);
    assert.equal(body.length, 1);
    assert.equal(body[0].title, 'Buy milk');
  });

  it('GET /todos/{id} returns a specific todo', async () => {
    const res = await adapter.handle(
      apiEvent('GET /todos/{id}', { pathParameters: { id: '1' } }),
    );
    assert.equal(res.statusCode, 200);
    assert.equal(JSON.parse(res.body).title, 'Buy milk');
  });

  it('PUT /todos/{id}/toggle toggles done status', async () => {
    const res = await adapter.handle(
      apiEvent('PUT /todos/{id}/toggle', { pathParameters: { id: '1' } }),
    );
    assert.equal(JSON.parse(res.body).done, 1);

    const res2 = await adapter.handle(
      apiEvent('PUT /todos/{id}/toggle', { pathParameters: { id: '1' } }),
    );
    assert.equal(JSON.parse(res2.body).done, 0);
  });

  it('POST /todos creates a second todo', async () => {
    const res = await adapter.handle(
      apiEvent('POST /todos', { body: JSON.stringify({ title: 'Walk the dog' }) }),
    );
    assert.equal(res.statusCode, 201);
    assert.equal(JSON.parse(res.body).title, 'Walk the dog');
  });

  it('GET /todos returns both todos', async () => {
    const res = await adapter.handle(apiEvent('GET /todos'));
    assert.equal(JSON.parse(res.body).length, 2);
  });

  it('DELETE /todos/{id} removes a todo', async () => {
    const res = await adapter.handle(
      apiEvent('DELETE /todos/{id}', { pathParameters: { id: '1' } }),
    );
    assert.equal(res.statusCode, 204);

    const list = await adapter.handle(apiEvent('GET /todos'));
    const body = JSON.parse(list.body);
    assert.equal(body.length, 1);
    assert.equal(body[0].title, 'Walk the dog');
  });

  it('GET /todos/{id} returns 404 for deleted todo', async () => {
    const res = await adapter.handle(
      apiEvent('GET /todos/{id}', { pathParameters: { id: '1' } }),
    );
    assert.equal(res.statusCode, 404);
  });

  it('TodoService is autowired into TodoController', () => {
    const ctrl = appCtx.get('todoController');
    assert.instanceOf(ctrl.todoService, TodoService);
  });

  it('JsdbcTemplate is autowired into TodoService', () => {
    const svc = appCtx.get('todoService');
    assert.exists(svc.jsdbcTemplate);
  });

  it('DataSource is auto-configured from jsdbc.url', () => {
    const ds = appCtx.get('dataSource');
    assert.exists(ds);
  });
});
