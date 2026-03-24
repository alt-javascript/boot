/**
 * boot-jsdbc integration tests.
 *
 * All tests use @alt-javascript/jsdbc-sqljs (sql.js WASM, in-memory).
 * No external database, no native dependencies — runs in CI without infrastructure.
 */
import { assert } from 'chai';
import '@alt-javascript/jsdbc-sqljs'; // self-registers SqlJsDriver with DriverManager

import { Context, Singleton } from '@alt-javascript/cdi';
import {
  jsdbcTemplateStarter,
  jsdbcStarter,
  JsdbcTemplate,
  NamedParameterJsdbcTemplate,
  ConfiguredDataSource,
  jsdbcAutoConfiguration,
} from '../index.js';

// ---------------------------------------------------------------------------
// Shared config
// ---------------------------------------------------------------------------

const IN_MEMORY_CONFIG = {
  boot: { 'banner-mode': 'off' },
  app: { name: 'boot-jsdbc-test', version: '1.0.0' },
  logging: { level: { ROOT: 'error' } },
  jsdbc: { url: 'jsdbc:sqljs:memory' },
};

// ---------------------------------------------------------------------------
// Helper: a minimal repository for wiring tests
// ---------------------------------------------------------------------------

class NoteRepository {
  constructor() {
    this.jsdbcTemplate = null; // autowired
  }

  async createTable() {
    await this.jsdbcTemplate.execute(
      'CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY, text TEXT)',
    );
  }

  async save(id, text) {
    return this.jsdbcTemplate.update(
      'INSERT INTO notes (id, text) VALUES (?, ?)', [id, text],
    );
  }

  async findAll() {
    return this.jsdbcTemplate.queryForList('SELECT * FROM notes ORDER BY id');
  }

  async findById(id) {
    return this.jsdbcTemplate.queryForObject(
      'SELECT * FROM notes WHERE id = ?', [id],
    );
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('boot-jsdbc', () => {

  // ── jsdbcTemplateStarter ──────────────────────────────────────────────────

  describe('jsdbcTemplateStarter()', () => {

    it('returns an applicationContext with dataSource, jsdbcTemplate, and namedParameterJsdbcTemplate beans', async () => {
      const { applicationContext } = await jsdbcTemplateStarter({
        config: IN_MEMORY_CONFIG,
        contexts: [],
      });

      assert.instanceOf(applicationContext.get('dataSource'), ConfiguredDataSource);
      assert.instanceOf(applicationContext.get('jsdbcTemplate'), JsdbcTemplate);
      assert.instanceOf(applicationContext.get('namedParameterJsdbcTemplate'), NamedParameterJsdbcTemplate);
    });

    it('auto-wires jsdbcTemplate into user repository beans', async () => {
      const { applicationContext } = await jsdbcTemplateStarter({
        config: IN_MEMORY_CONFIG,
        contexts: [new Context([new Singleton(NoteRepository)])],
      });

      const repo = applicationContext.get('noteRepository');
      assert.instanceOf(repo.jsdbcTemplate, JsdbcTemplate, 'jsdbcTemplate should be autowired');
    });

    it('auto-wired repository can execute DDL and DML via jsdbcTemplate', async () => {
      const { applicationContext } = await jsdbcTemplateStarter({
        config: IN_MEMORY_CONFIG,
        contexts: [new Context([new Singleton(NoteRepository)])],
      });

      const repo = applicationContext.get('noteRepository');
      await repo.createTable();
      await repo.save(1, 'First note');
      await repo.save(2, 'Second note');

      const notes = await repo.findAll();
      assert.equal(notes.length, 2);
      assert.equal(notes[0].text, 'First note');
      assert.equal(notes[1].text, 'Second note');
    });

    it('queryForObject returns a single row by ID', async () => {
      const { applicationContext } = await jsdbcTemplateStarter({
        config: IN_MEMORY_CONFIG,
        contexts: [new Context([new Singleton(NoteRepository)])],
      });

      const repo = applicationContext.get('noteRepository');
      await repo.createTable();
      await repo.save(42, 'The answer');

      const note = await repo.findById(42);
      assert.equal(note.id, 42);
      assert.equal(note.text, 'The answer');
    });

    it('does not register beans when jsdbc.url is absent from config', async () => {
      const { applicationContext } = await jsdbcTemplateStarter({
        config: {
          boot: { 'banner-mode': 'off' },
          app: { name: 'no-db-test' },
          logging: { level: { ROOT: 'error' } },
        },
        contexts: [],
      });

      assert.isNull(applicationContext.get('dataSource', null));
      assert.isNull(applicationContext.get('jsdbcTemplate', null));
    });

    it('respects an existing dataSource bean — does not replace it', async () => {
      const customDs = { custom: true, getConnection: async () => {} };

      const { applicationContext } = await jsdbcTemplateStarter({
        config: IN_MEMORY_CONFIG,
        contexts: [
          new Context([{ Reference: customDs, name: 'dataSource', scope: 'singleton' }]),
        ],
      });

      const ds = applicationContext.get('dataSource');
      assert.equal(ds.custom, true, 'should retain the user-provided dataSource');
    });

  });

  // ── jsdbcStarter (component array) ───────────────────────────────────────

  describe('jsdbcStarter()', () => {

    it('returns the same component definitions as jsdbcAutoConfiguration()', () => {
      const fromStarter = jsdbcStarter();
      const fromAutoConf = jsdbcAutoConfiguration();
      assert.deepEqual(
        fromStarter.map((c) => c.name),
        fromAutoConf.map((c) => c.name),
      );
    });

    it('produces registerable component definitions (have name and Reference)', () => {
      const components = jsdbcStarter();
      assert.isArray(components);
      assert.isAbove(components.length, 0);
      components.forEach((c) => {
        assert.isString(c.name, `component ${c.name} should have a string name`);
        assert.exists(c.Reference, `component ${c.name} should have a Reference`);
      });
    });

  });

  // ── Named parameters ──────────────────────────────────────────────────────

  describe('NamedParameterJsdbcTemplate via auto-wiring', () => {

    it('supports named :param placeholders in queries', async () => {
      const { applicationContext } = await jsdbcTemplateStarter({
        config: IN_MEMORY_CONFIG,
        contexts: [],
      });

      const tmpl = applicationContext.get('namedParameterJsdbcTemplate');

      await tmpl.execute('CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, price REAL)');
      await tmpl.update(
        'INSERT INTO products VALUES (:id, :name, :price)',
        { id: 1, name: 'Widget', price: 9.99 },
      );

      const row = await tmpl.queryForObject(
        'SELECT * FROM products WHERE id = :id', { id: 1 },
      );
      assert.equal(row.name, 'Widget');
      assert.closeTo(row.price, 9.99, 0.01);
    });

  });

  // ── Transaction support ───────────────────────────────────────────────────

  describe('JsdbcTemplate.executeInTransaction()', () => {

    it('commits on success', async () => {
      const { applicationContext } = await jsdbcTemplateStarter({
        config: IN_MEMORY_CONFIG,
        contexts: [],
      });

      const tmpl = applicationContext.get('jsdbcTemplate');
      await tmpl.execute('CREATE TABLE txtest (id INTEGER PRIMARY KEY, val TEXT)');

      await tmpl.executeInTransaction(async (tx) => {
        await tx.update('INSERT INTO txtest VALUES (?, ?)', [1, 'committed']);
      });

      const rows = await tmpl.queryForList('SELECT * FROM txtest');
      assert.equal(rows.length, 1);
      assert.equal(rows[0].val, 'committed');
    });

    it('rolls back on error', async () => {
      const { applicationContext } = await jsdbcTemplateStarter({
        config: IN_MEMORY_CONFIG,
        contexts: [],
      });

      const tmpl = applicationContext.get('jsdbcTemplate');
      await tmpl.execute('CREATE TABLE rollbacktest (id INTEGER PRIMARY KEY, val TEXT)');

      try {
        await tmpl.executeInTransaction(async (tx) => {
          await tx.update('INSERT INTO rollbacktest VALUES (?, ?)', [1, 'should-rollback']);
          throw new Error('deliberate failure');
        });
      } catch {
        // expected
      }

      const rows = await tmpl.queryForList('SELECT * FROM rollbacktest');
      assert.equal(rows.length, 0, 'rolled back — table should be empty');
    });

  });

});
