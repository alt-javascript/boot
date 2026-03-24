/**
 * example-5-3-persistence-flyway — service tests
 *
 * Verifies NoteRepository works after Flyway has applied all migrations.
 * Flyway owns the schema — no DDL in test code.
 */
import { assert } from 'chai';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import '@alt-javascript/jsdbc-sqljs';
import { Context, Singleton } from '@alt-javascript/cdi';
import { jsdbcTemplateStarter } from '@alt-javascript/boot-jsdbc';
import { flywayStarter } from '@alt-javascript/boot-flyway';
import { NoteRepository } from '../src/services.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const MIGRATIONS = resolve(__dirname, '../db/migration');

const BASE_CONFIG = {
  boot: {
    'banner-mode': 'off',
    datasource: { url: 'jsdbc:sqljs:memory' },
    flyway: { locations: MIGRATIONS },
  },
  app: { name: 'test' },
  logging: { level: { ROOT: 'error' } },
};

describe('example-5-3-persistence-flyway', () => {

  let repo;
  let managedFlyway;

  beforeEach(async () => {
    const { applicationContext } = await jsdbcTemplateStarter({
      config: BASE_CONFIG,
      contexts: [new Context([...flywayStarter(), new Singleton(NoteRepository)])],
    });
    managedFlyway = applicationContext.get('managedFlyway');
    await managedFlyway.ready(); // wait for all migrations to apply
    repo = applicationContext.get('noteRepository');
  });

  it('V1–V3 migrations applied — 3 notes seeded', async () => {
    const notes = await repo.findAll();
    assert.equal(notes.length, 3);
  });

  it('notes have priority field from V2 migration', async () => {
    const notes = await repo.findAll();
    notes.forEach((n) => assert.isNumber(n.priority));
  });

  it('notes have createdAt timestamp field from V1 migration', async () => {
    const notes = await repo.findAll();
    notes.forEach((n) => assert.isString(n.createdAt));
  });

  it('all migrations recorded as SUCCESS in history', async () => {
    const info = await managedFlyway.getFlyway().info();
    assert.equal(info.length, 3);
    info.forEach((m) => assert.equal(m.state, 'SUCCESS'));
  });

  it('migration is idempotent — second migrate() executes 0 new migrations', async () => {
    const result = await managedFlyway.getFlyway().migrate();
    assert.equal(result.migrationsExecuted, 0);
  });

  it('save() inserts a new note with priority', async () => {
    const id = await repo.save('Test note', 'Body.', 5);
    assert.isNumber(id);
    const note = await repo.findById(id);
    assert.equal(note.title, 'Test note');
    assert.equal(note.priority, 5);
  });

  it('markDone() sets done flag', async () => {
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
  });

});
