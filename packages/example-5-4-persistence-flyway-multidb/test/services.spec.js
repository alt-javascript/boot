/**
 * example-5-4-persistence-flyway-multidb — service tests
 *
 * Verifies that two independent datasources with two Flyway runners coexist
 * in a single ApplicationContext, each managing their own schema independently.
 */
import { assert } from 'chai';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import '@alt-javascript/jsdbc-sqljs';
import { Context, Singleton } from '@alt-javascript/cdi';
import { jsdbcTemplateStarter, DataSourceBuilder } from '@alt-javascript/boot-jsdbc';
import { flywayStarter } from '@alt-javascript/boot-flyway';
import { NoteRepository, TagRepository } from '../src/services.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const NOTES_MIGRATIONS = resolve(__dirname, '../db/notes-migration');
const TAGS_MIGRATIONS  = resolve(__dirname, '../db/tags-migration');

function buildContext() {
  const tagsComponents = DataSourceBuilder.create()
    .prefix('boot.datasource-tags')
    .beanNames({
      dataSource:                  'tagsDataSource',
      jsdbcTemplate:               'tagsJsdbcTemplate',
      namedParameterJsdbcTemplate: 'tagsNamedParameterJsdbcTemplate',
    })
    .withoutSchemaInitializer()
    .build();

  const tagsFlywayComponents = flywayStarter({
    prefix:         'boot.flyway-tags',
    datasourceBean: 'tagsDataSource',
  }).map((c) => c.name === 'managedFlyway' ? { ...c, name: 'managedFlywayTags' } : c);

  return new Context([
    ...flywayStarter(),
    ...tagsComponents,
    ...tagsFlywayComponents,
    new Singleton(NoteRepository),
    new Singleton(TagRepository),
  ]);
}

const BASE_CONFIG = {
  boot: {
    'banner-mode': 'off',
    datasource:        { url: 'jsdbc:sqljs:memory' },
    'datasource-tags': { url: 'jsdbc:sqljs:memory' },
    flyway:            { locations: NOTES_MIGRATIONS },
    'flyway-tags':     { locations: TAGS_MIGRATIONS, enabled: true },
  },
  app:     { name: 'test' },
  logging: { level: { ROOT: 'error' } },
};

describe('example-5-4-persistence-flyway-multidb', () => {

  let noteRepo;
  let tagRepo;
  let managedFlyway;
  let managedFlywayTags;

  beforeEach(async () => {
    const { applicationContext } = await jsdbcTemplateStarter({
      config: BASE_CONFIG,
      contexts: [buildContext()],
    });

    managedFlyway     = applicationContext.get('managedFlyway');
    managedFlywayTags = applicationContext.get('managedFlywayTags');

    // Both runners fire concurrently — await both before querying
    await Promise.all([managedFlyway.ready(), managedFlywayTags.ready()]);

    noteRepo = applicationContext.get('noteRepository');
    tagRepo  = applicationContext.get('tagRepository');
  });

  // ── Notes database ──────────────────────────────────────────────────────

  describe('notes database (primary datasource)', () => {

    it('notes migrations applied — 2 notes seeded', async () => {
      const notes = await noteRepo.findAll();
      assert.equal(notes.length, 2);
    });

    it('notes migration history has 2 entries, all SUCCESS', async () => {
      const info = await managedFlyway.getFlyway().info();
      assert.equal(info.length, 2);
      info.forEach((m) => assert.equal(m.state, 'SUCCESS'));
    });

    it('save() inserts a note into the notes database', async () => {
      const id = await noteRepo.save('New note', 'body');
      assert.isNumber(id);
      const all = await noteRepo.findAll();
      assert.equal(all.length, 3);
    });

  });

  // ── Tags database ───────────────────────────────────────────────────────

  describe('tags database (secondary datasource)', () => {

    it('tags migrations applied — 3 tags seeded', async () => {
      const tags = await tagRepo.findAllTags();
      assert.equal(tags.length, 3);
      assert.deepEqual(tags.map((t) => t.name), ['important', 'personal', 'work']);
    });

    it('tags migration history has 3 entries, all SUCCESS', async () => {
      const info = await managedFlywayTags.getFlyway().info();
      assert.equal(info.length, 3);
      info.forEach((m) => assert.equal(m.state, 'SUCCESS'));
    });

    it('saveTag() adds a new tag to the tags database', async () => {
      const id = await tagRepo.saveTag('archived');
      assert.isNumber(id);
      const tags = await tagRepo.findAllTags();
      assert.equal(tags.length, 4);
    });

  });

  // ── Cross-database operations ───────────────────────────────────────────

  describe('cross-database operations', () => {

    it('tagNote() links a note ID (notes DB) with a tag ID (tags DB)', async () => {
      const notes = await noteRepo.findAll();
      const tags  = await tagRepo.findAllTags();

      const noteId = notes[0].id;
      const tagId  = tags.find((t) => t.name === 'important').id;

      await tagRepo.tagNote(noteId, tagId);

      const linked = await tagRepo.tagsForNote(noteId);
      assert.equal(linked.length, 1);
      assert.equal(linked[0].name, 'important');
    });

    it('tagsForNote() returns multiple tags for a note', async () => {
      const notes = await noteRepo.findAll();
      const tags  = await tagRepo.findAllTags();

      const noteId = notes[0].id;
      await tagRepo.tagNote(noteId, tags.find((t) => t.name === 'work').id);
      await tagRepo.tagNote(noteId, tags.find((t) => t.name === 'personal').id);

      const linked = await tagRepo.tagsForNote(noteId);
      assert.equal(linked.length, 2);
      assert.sameMembers(linked.map((t) => t.name), ['work', 'personal']);
    });

    it('two databases are independent — no cross-contamination of migration histories', async () => {
      const notesInfo = await managedFlyway.getFlyway().info();
      const tagsInfo  = await managedFlywayTags.getFlyway().info();
      // notes has 2 migrations, tags has 3 — different histories
      assert.equal(notesInfo.length, 2);
      assert.equal(tagsInfo.length, 3);
    });

    it('tags migration is idempotent — second migrate() on tags runs 0 migrations', async () => {
      const result = await managedFlywayTags.getFlyway().migrate();
      assert.equal(result.migrationsExecuted, 0);
    });

  });

});
