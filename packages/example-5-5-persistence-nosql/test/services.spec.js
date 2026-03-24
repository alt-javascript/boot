/**
 * example-5-5-persistence-nosql — service tests
 *
 * Verifies NoteRepository using the in-memory jsnosqlc driver.
 * No schema, no migrations — documents are pure JS objects.
 */
import { assert } from 'chai';
import '@alt-javascript/jsnosqlc-memory';
import { Context, Singleton } from '@alt-javascript/cdi';
import { EphemeralConfig } from '@alt-javascript/config';
import { ApplicationContext } from '@alt-javascript/cdi';
import { jsnosqlcAutoConfiguration } from '@alt-javascript/boot-jsnosqlc';
import { NoteRepository } from '../src/services.js';

const BASE_CONFIG = {
  boot: { 'banner-mode': 'off', nosql: { url: 'jsnosqlc:memory:' } },
  app: { name: 'test' },
  logging: { level: { ROOT: 'error' } },
};

describe('example-5-5-persistence-nosql', () => {

  let repo;
  let nosqlClient;

  beforeEach(async () => {
    const config = new EphemeralConfig(BASE_CONFIG);
    const appCtx = new ApplicationContext({
      contexts: [
        new Context(jsnosqlcAutoConfiguration()),
        new Context([new Singleton(NoteRepository)]),
      ],
      config,
    });
    await appCtx.start({ run: false });
    nosqlClient = appCtx.get('nosqlClient');
    await nosqlClient.ready();
    repo = appCtx.get('noteRepository');
  });

  it('save() inserts a note and returns an _id string', async () => {
    const id = await repo.save('Test note', 'Body.');
    assert.isString(id);
    assert.isAbove(id.length, 0);
  });

  it('findById() retrieves the inserted document', async () => {
    const id = await repo.save('Find me', 'Body.', ['search']);
    const note = await repo.findById(id);
    assert.equal(note.title, 'Find me');
    assert.equal(note.body, 'Body.');
    assert.deepEqual(note.tags, ['search']);
    assert.isFalse(note.done);
    assert.isString(note.createdAt);
  });

  it('findAll() returns all inserted notes', async () => {
    await repo.save('Note A', '', ['a']);
    await repo.save('Note B', '', ['b']);
    await repo.save('Note C', '', ['a', 'b']);
    const all = await repo.findAll();
    assert.equal(all.length, 3);
  });

  it('findByTag() returns only notes with the given tag', async () => {
    await repo.save('Tagged work',    '', ['work', 'important']);
    await repo.save('Tagged personal','', ['personal']);
    await repo.save('Tagged both',    '', ['work', 'personal']);

    const workNotes = await repo.findByTag('work');
    assert.equal(workNotes.length, 2);
    assert.isTrue(workNotes.every((n) => n.tags.includes('work')));
  });

  it('findPending() returns only notes where done = false', async () => {
    const id1 = await repo.save('Pending 1');
    const id2 = await repo.save('Pending 2');
    await repo.save('Done note');
    await repo.markDone(await repo.save('Already done'));

    const pending = await repo.findPending();
    // All freshly saved notes start as pending; the explicitly-marked one is excluded
    assert.isTrue(pending.every((n) => n.done === false));
  });

  it('markDone() sets done = true without losing other fields', async () => {
    const id = await repo.save('Mark me', 'Body text.', ['tag1']);
    await repo.markDone(id);
    const note = await repo.findById(id);
    assert.isTrue(note.done);
    assert.equal(note.title, 'Mark me');   // preserved
    assert.equal(note.body, 'Body text.'); // preserved
    assert.deepEqual(note.tags, ['tag1']); // preserved
  });

  it('update() patches arbitrary fields without losing others', async () => {
    const id = await repo.save('Patch me', 'Original.', ['tag']);
    await nosqlClient.getCollection('notes').update(id, { body: 'Updated.' });
    const note = await repo.findById(id);
    assert.equal(note.body, 'Updated.');
    assert.equal(note.title, 'Patch me'); // preserved
  });

  it('remove() deletes a note — findById returns null', async () => {
    const id = await repo.save('Delete me');
    await repo.remove(id);
    assert.isNull(await repo.findById(id));
  });

  it('cursor supports for-await-of iteration over find results', async () => {
    const { Filter } = await import('@alt-javascript/jsnosqlc-core');
    await repo.save('Iter A', '', ['iter']);
    await repo.save('Iter B', '', ['iter']);
    await repo.save('Other', '', ['other']);

    const col = nosqlClient.getCollection('notes');
    const cursor = await col.find(Filter.where('tags').contains('iter').build());
    const results = [];
    for await (const doc of cursor) {
      results.push(doc);
    }
    assert.equal(results.length, 2);
    assert.isTrue(results.every((d) => d.tags.includes('iter')));
  });

});
