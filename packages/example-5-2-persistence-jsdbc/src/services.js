/**
 * example-5-2-persistence-jsdbc — services
 *
 * Demonstrates @alt-javascript/boot-jsdbc with schema/data files.
 *
 * SchemaInitializer (registered by jsdbcTemplateStarter) automatically loads:
 *   config/schema.sql — CREATE TABLE statements
 *   config/data.sql   — seed INSERT statements
 *
 * NoteRepository.jsdbcTemplate is autowired by CDI.
 * No DDL or seed logic lives in application code.
 */

/**
 * NoteRepository — CDI-managed repository backed by JsdbcTemplate.
 *
 * Schema and seed data are applied by SchemaInitializer before this bean's
 * init() runs (SchemaInitializer has lower dependsOn priority).
 */
export class NoteRepository {
  static qualifier = '@alt-javascript/example-5-2-persistence-jsdbc/NoteRepository';

  constructor() {
    this.logger = null;        // autowired
    this.config = null;        // autowired
    this.jsdbcTemplate = null; // autowired from jsdbcTemplateStarter()
  }

  async init() {
    this.logger.info('NoteRepository.init() — schema applied by SchemaInitializer');
  }

  /** @returns {Promise<Array>} all notes */
  async findAll() {
    return this.jsdbcTemplate.queryForList(
      'SELECT * FROM notes ORDER BY id',
      [],
      (row) => ({ id: row.id, title: row.title, body: row.body, done: !!row.done }),
    );
  }

  /** @returns {Promise<Object>} single note by ID */
  async findById(id) {
    return this.jsdbcTemplate.queryForObject(
      'SELECT * FROM notes WHERE id = ?', [id],
      (row) => ({ id: row.id, title: row.title, body: row.body, done: !!row.done }),
    );
  }

  /** @returns {Promise<number>} generated ID */
  async save(title, body = '') {
    await this.jsdbcTemplate.update(
      'INSERT INTO notes (title, body) VALUES (?, ?)', [title, body],
    );
    const row = await this.jsdbcTemplate.queryForObject(
      'SELECT MAX(id) AS id FROM notes',
    );
    return row.id;
  }

  /** @returns {Promise<number>} affected rows */
  async markDone(id) {
    return this.jsdbcTemplate.update(
      'UPDATE notes SET done = 1 WHERE id = ?', [id],
    );
  }

  /** @returns {Promise<number>} affected rows */
  async remove(id) {
    return this.jsdbcTemplate.update(
      'DELETE FROM notes WHERE id = ?', [id],
    );
  }
}

/**
 * Application — lifecycle entry point. Demonstrates NoteRepository in action.
 */
export class Application {
  static qualifier = '@alt-javascript/example-5-2-persistence-jsdbc/Application';

  constructor() {
    this.logger = null;          // autowired
    this.config = null;          // autowired
    this.noteRepository = null;  // autowired
    this.appName = '${app.name:Persistence Example}';
  }

  async run() {
    this.logger.info(`[${this.appName}] Starting demo`);

    const notes = await this.noteRepository.findAll();
    console.log('\n── All notes (loaded from data.sql) ──────────────');
    notes.forEach((n) => console.log(`  [${n.id}] ${n.title}`));

    // Add a new note programmatically
    const newId = await this.noteRepository.save(
      'Created at runtime',
      'Added after SchemaInitializer seeded the table.',
    );
    this.logger.info(`Created note id=${newId}`);

    // Mark the first note as done
    await this.noteRepository.markDone(notes[0].id);

    const updated = await this.noteRepository.findAll();
    console.log('\n── After update ───────────────────────────────────');
    updated.forEach((n) => console.log(`  [${n.id}] ${n.done ? '✓' : '○'} ${n.title}`));

    console.log('\n── Done ───────────────────────────────────────────\n');
    this.logger.info(`[${this.appName}] Demo complete`);
  }
}
