/**
 * example-5-2-persistence-jsdbc — service tests
 *
 * Tests NoteRepository directly with jsdbcTemplateStarter() + in-memory sqljs.
 * No external database required.
 */
import { assert } from 'chai';
import '@alt-javascript/jsdbc-sqljs';
import { Context, Singleton } from '@alt-javascript/cdi';
import { jsdbcTemplateStarter } from '@alt-javascript/boot-jsdbc';
import { NoteRepository } from '../src/services.js';

const BASE_CONFIG = {
  boot: { 'banner-mode': 'off' },
  app: { name: 'test', version: '1.0.0' },
  logging: { level: { ROOT: 'error' } },
  jsdbc: { url: 'jsdbc:sqljs:memory' },
};

describe('example-5-2-persistence-jsdbc', () => {

  let repo;

  beforeEach(async () => {
    const { applicationContext } = await jsdbcTemplateStarter({
      config: BASE_CONFIG,
      contexts: [new Context([new Singleton(NoteRepository)])],
    });
    repo = applicationContext.get('noteRepository');
    await repo.init(); // create schema + seed 2 notes
  });

  it('init() seeds 2 notes', async () => {
    const notes = await repo.findAll();
    assert.equal(notes.length, 2);
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
    assert.equal(remaining.length, 1);
    assert.notEqual(remaining[0].id, notes[0].id);
  });

});
