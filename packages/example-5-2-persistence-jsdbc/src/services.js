/**
 * example-5-2-persistence-jsdbc — services
 *
 * Demonstrates @alt-javascript/boot-jsdbc: jsdbcTemplateStarter() auto-configures
 * DataSource, JsdbcTemplate, and NamedParameterJsdbcTemplate from jsdbc.* config.
 *
 * NoteRepository and Application are CDI singletons. NoteRepository.jsdbcTemplate
 * is null-wired automatically — no manual wiring required.
 */

/**
 * NoteRepository — CDI-managed repository backed by JsdbcTemplate.
 *
 * jsdbcTemplate is auto-wired by CDI from the dataSource → JsdbcTemplate
 * bean registered by jsdbcTemplateStarter().
 */
export class NoteRepository {
  static qualifier = '@alt-javascript/example-5-2-persistence-jsdbc/NoteRepository';

  constructor() {
    this.logger = null;        // autowired
    this.config = null;        // autowired
    this.jsdbcTemplate = null; // autowired from jsdbcTemplateStarter()
  }

  async init() {
    this.logger.info('NoteRepository.init() — creating schema');
    await this.jsdbcTemplate.execute(
      `CREATE TABLE IF NOT EXISTS notes (
         id    INTEGER PRIMARY KEY AUTOINCREMENT,
         title TEXT NOT NULL,
         body  TEXT,
         done  INTEGER DEFAULT 0
       )`,
    );
    // Seed a few rows for demo purposes
    const count = await this.jsdbcTemplate.queryForObject(
      'SELECT COUNT(*) AS n FROM notes',
    );
    if (count.n === 0) {
      await this.jsdbcTemplate.update(
        'INSERT INTO notes (title, body) VALUES (?, ?)',
        ['Learn @alt-javascript/boot', 'Read the docs and examples.'],
      );
      await this.jsdbcTemplate.update(
        'INSERT INTO notes (title, body) VALUES (?, ?)',
        ['Try persistence with jsdbc', 'jsdbcTemplateStarter auto-wires the DataSource.'],
      );
      this.logger.info('NoteRepository.init() — seed data inserted');
    }
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
    console.log('\n── All notes ─────────────────────────');
    notes.forEach((n) => console.log(`  [${n.id}] ${n.title}`));

    // Add a new note
    const newId = await this.noteRepository.save(
      'Explore NamedParameterJsdbcTemplate',
      'Use :param syntax for named placeholders.',
    );
    this.logger.info(`Created note id=${newId}`);

    // Mark the first note as done
    await this.noteRepository.markDone(notes[0].id);

    const updated = await this.noteRepository.findAll();
    console.log('\n── After update ──────────────────────');
    updated.forEach((n) => console.log(`  [${n.id}] ${n.done ? '✓' : '○'} ${n.title}`));

    console.log('\n── Done ──────────────────────────────\n');
    this.logger.info(`[${this.appName}] Demo complete`);
  }
}
