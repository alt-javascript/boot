/**
 * example-5-2-persistence-jsdbc — service tests
 *
 * Schema and seed data are loaded from config/schema.sql + config/data.sql
 * by SchemaInitializer (registered automatically by jsdbcTemplateStarter).
 *
 * No DDL or seed logic in test code — this mirrors the production boot path.
 */
import { assert } from 'chai';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import '@alt-javascript/jsdbc-sqljs';
import { Context, Singleton } from '@alt-javascript/cdi';
import { jsdbcTemplateStarter } from '@alt-javascript/boot-jsdbc';
import { NoteRepository } from '../src/services.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const CONFIG_DIR = resolve(__dirname, '../config');

const BASE_CONFIG = {
  boot: {
    'banner-mode': 'off',
    datasource: {
      url: 'jsdbc:sqljs:memory',
      // Point SchemaInitializer at this example's SQL files
      schema: `${CONFIG_DIR}/schema.sql`,
      data: `${CONFIG_DIR}/data.sql`,
    },
  },
  app: { name: 'test', version: '1.0.0' },
  logging: { level: { ROOT: 'error' } },
};

describe('example-5-2-persistence-jsdbc', () => {

  let repo;

  beforeEach(async () => {
    const { applicationContext } = await jsdbcTemplateStarter({
      config: BASE_CONFIG,
      contexts: [new Context([new Singleton(NoteRepository)])],
    });
    // SchemaInitializer.init() is async; CDI does not await it.
    // Call ready() so schema.sql + data.sql are applied before querying.
    await applicationContext.get('schemaInitializer').ready();
    repo = applicationContext.get('noteRepository');
  });

  it('schema.sql + data.sql seed 3 notes via SchemaInitializer', async () => {
    const notes = await repo.findAll();
    assert.equal(notes.length, 3);
  });

  it('findAll() returns notes with id, title, body, done fields', async () => {
    const notes = await repo.findAll();
    assert.isNumber(notes[0].id);
    assert.isString(notes[0].title);
    assert.isString(notes[0].body);
    assert.isBoolean(notes[0].done);
  });

  it('save() inserts a new note and returns its ID', async () => {
    const id = await repo.save('New note', 'Body text');
    assert.isNumber(id);
    const note = await repo.findById(id);
    assert.equal(note.title, 'New note');
    assert.equal(note.body, 'Body text');
    assert.isFalse(note.done);
  });

  it('markDone() updates the done flag', async () => {
    const notes = await repo.findAll();
    await repo.markDone(notes[0].id);
    const updated = await repo.findById(notes[0].id);
    assert.isTrue(updated.done);
  });

  it('remove() deletes a note', async () => {
    const notes = await repo.findAll();
    await repo.remove(notes[0].id);
    const remaining = await repo.findAll();
    assert.equal(remaining.length, 2);
    assert.notEqual(remaining[0].id, notes[0].id);
  });

});
