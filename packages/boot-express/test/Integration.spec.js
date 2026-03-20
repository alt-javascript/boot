/**
 * Integration test: Express + JSDBC full-stack example.
 *
 * Proves: boot → config → CDI → JSDBC (sql.js in-memory) → Express → HTTP
 *
 * A TodoService backed by JsdbcTemplate, exposed via a TodoController
 * with CRUD routes, all wired through CDI auto-configuration.
 */
import { assert } from 'chai';
import supertest from 'supertest';
import { EphemeralConfig } from '@alt-javascript/config';
import { ApplicationContext } from '@alt-javascript/cdi';
import { Context } from '@alt-javascript/cdi/context/index.js';
import { jsdbcAutoConfiguration } from '@alt-javascript/jsdbc-template';
import '@alt-javascript/jsdbc-sqljs'; // self-registers SqlJs driver
import { expressAutoConfiguration } from '../index.js';

// -- Domain: TodoService (framework-agnostic) --

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

// -- Controller: TodoController (Express-specific) --

class TodoController {
  static __routes = [
    { method: 'GET', path: '/todos', handler: 'list' },
    { method: 'GET', path: '/todos/:id', handler: 'getById' },
    { method: 'POST', path: '/todos', handler: 'create' },
    { method: 'PUT', path: '/todos/:id/toggle', handler: 'toggle' },
    { method: 'DELETE', path: '/todos/:id', handler: 'remove' },
  ];

  constructor() {
    this.todoService = null; // autowired
  }

  async list(req, res) {
    const todos = await this.todoService.findAll();
    res.json(todos);
  }

  async getById(req, res) {
    try {
      const todo = await this.todoService.findById(Number(req.params.id));
      res.json(todo);
    } catch {
      res.status(404).json({ error: 'Not found' });
    }
  }

  async create(req, res) {
    const todo = await this.todoService.create(req.body.title);
    res.status(201).json(todo);
  }

  async toggle(req, res) {
    const todo = await this.todoService.toggleDone(Number(req.params.id));
    res.json(todo);
  }

  async remove(req, res) {
    await this.todoService.remove(Number(req.params.id));
    res.status(204).end();
  }
}

// -- Test setup --

async function buildFullStack() {
  const config = new EphemeralConfig({
    server: { port: 0 },
    jsdbc: { url: 'jsdbc:sqljs:memory' },
  });

  const context = new Context([
    ...expressAutoConfiguration(),
    ...jsdbcAutoConfiguration(),
    { Reference: TodoService, name: 'todoService', scope: 'singleton' },
    { Reference: TodoController, name: 'todoController', scope: 'singleton' },
  ]);

  const appCtx = new ApplicationContext({ contexts: [context], config });
  await appCtx.start({ run: false });
  return appCtx;
}

describe('Express + JSDBC Integration', () => {
  let appCtx;
  let app;

  before(async () => {
    appCtx = await buildFullStack();
    app = appCtx.get('expressAdapter').app;
    // Initialize schema after CDI wiring
    await appCtx.get('todoService').createTable();
  });

  after(async () => {
    const ds = appCtx.get('dataSource');
    if (ds && typeof ds.destroy === 'function') await ds.destroy();
    appCtx.get('expressAdapter').destroy();
  });

  it('GET /todos returns empty list initially', async () => {
    const res = await supertest(app).get('/todos').expect(200);
    assert.deepEqual(res.body, []);
  });

  it('POST /todos creates a todo', async () => {
    const res = await supertest(app)
      .post('/todos')
      .send({ title: 'Buy milk' })
      .expect(201);

    assert.equal(res.body.title, 'Buy milk');
    assert.equal(res.body.done, 0);
    assert.exists(res.body.id);
  });

  it('GET /todos returns the created todo', async () => {
    const res = await supertest(app).get('/todos').expect(200);
    assert.equal(res.body.length, 1);
    assert.equal(res.body[0].title, 'Buy milk');
  });

  it('GET /todos/:id returns a specific todo', async () => {
    const res = await supertest(app).get('/todos/1').expect(200);
    assert.equal(res.body.title, 'Buy milk');
  });

  it('PUT /todos/:id/toggle toggles done status', async () => {
    const res = await supertest(app).put('/todos/1/toggle').expect(200);
    assert.equal(res.body.done, 1);

    // Toggle back
    const res2 = await supertest(app).put('/todos/1/toggle').expect(200);
    assert.equal(res2.body.done, 0);
  });

  it('POST /todos creates a second todo', async () => {
    const res = await supertest(app)
      .post('/todos')
      .send({ title: 'Walk the dog' })
      .expect(201);

    assert.equal(res.body.title, 'Walk the dog');
  });

  it('GET /todos returns both todos', async () => {
    const res = await supertest(app).get('/todos').expect(200);
    assert.equal(res.body.length, 2);
  });

  it('DELETE /todos/:id removes a todo', async () => {
    await supertest(app).delete('/todos/1').expect(204);
    const res = await supertest(app).get('/todos').expect(200);
    assert.equal(res.body.length, 1);
    assert.equal(res.body[0].title, 'Walk the dog');
  });

  it('GET /todos/:id returns 404 for deleted todo', async () => {
    await supertest(app).get('/todos/1').expect(404);
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
