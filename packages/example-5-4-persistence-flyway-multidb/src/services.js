/**
 * example-5-4-persistence-flyway-multidb — services
 *
 * Demonstrates multi-database deployment: two independent DataSources with
 * separate Flyway migration runners in a single ApplicationContext.
 *
 * Database layout:
 *   notes DB (primary — boot.datasource):
 *     notes table — managed by boot.flyway migrations
 *
 *   tags DB (secondary — boot.datasource-tags):
 *     tags, note_tags tables — managed by boot.flyway-tags migrations
 *
 * CDI wiring:
 *   dataSource              → jsdbcTemplate          → NoteRepository
 *   tagsDataSource          → tagsJsdbcTemplate      → TagRepository
 *   managedFlyway           — runs notes migrations on start
 *   managedFlywayTags       — runs tags migrations on start
 *
 * This pattern mirrors Spring Boot's multiple DataSource support:
 * each datasource has its own JPA/JDBC stack and its own Flyway runner.
 */

/**
 * NoteRepository — backed by the primary (notes) datasource.
 */
export class NoteRepository {
  static qualifier = '@alt-javascript/example-5-4-persistence-flyway-multidb/NoteRepository';

  constructor() {
    this.logger = null;        // autowired
    this.jsdbcTemplate = null; // autowired — primary template
  }

  /** @returns {Promise<Array>} */
  async findAll() {
    return this.jsdbcTemplate.queryForList(
      'SELECT * FROM notes ORDER BY id',
      [],
      (row) => ({ id: row.id, title: row.title, body: row.body, done: !!row.done }),
    );
  }

  /** @returns {Promise<number>} generated ID */
  async save(title, body = '') {
    await this.jsdbcTemplate.update(
      'INSERT INTO notes (title, body) VALUES (?, ?)', [title, body],
    );
    const row = await this.jsdbcTemplate.queryForObject('SELECT MAX(id) AS id FROM notes');
    return row.id;
  }
}

/**
 * TagRepository — backed by the secondary (tags) datasource.
 *
 * tagsJsdbcTemplate is autowired by CDI from the DataSourceBuilder-registered
 * tagsJsdbcTemplate bean.
 */
export class TagRepository {
  static qualifier = '@alt-javascript/example-5-4-persistence-flyway-multidb/TagRepository';

  constructor() {
    this.logger = null;             // autowired
    this.tagsJsdbcTemplate = null;  // autowired — secondary template
  }

  /** @returns {Promise<Array>} all tags */
  async findAllTags() {
    return this.tagsJsdbcTemplate.queryForList(
      'SELECT * FROM tags ORDER BY name',
      [],
      (row) => ({ id: row.id, name: row.name }),
    );
  }

  /** @returns {Promise<number>} generated tag ID */
  async saveTag(name) {
    await this.tagsJsdbcTemplate.update(
      'INSERT OR IGNORE INTO tags (name) VALUES (?)', [name],
    );
    const row = await this.tagsJsdbcTemplate.queryForObject(
      'SELECT id FROM tags WHERE name = ?', [name],
    );
    return row.id;
  }

  /** @returns {Promise<void>} */
  async tagNote(noteId, tagId) {
    await this.tagsJsdbcTemplate.update(
      'INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)',
      [noteId, tagId],
    );
  }

  /** @returns {Promise<Array>} tags for a given noteId */
  async tagsForNote(noteId) {
    return this.tagsJsdbcTemplate.queryForList(
      `SELECT t.id, t.name FROM tags t
       JOIN note_tags nt ON nt.tag_id = t.id
       WHERE nt.note_id = ?
       ORDER BY t.name`,
      [noteId],
      (row) => ({ id: row.id, name: row.name }),
    );
  }
}

/**
 * Application — lifecycle entry point.
 *
 * Awaits BOTH managedFlyway.ready() and managedFlywayTags.ready() before
 * querying either database. Migrations run concurrently during CDI init;
 * ready() waits for each runner to complete independently.
 */
export class Application {
  static qualifier = '@alt-javascript/example-5-4-persistence-flyway-multidb/Application';

  constructor() {
    this.logger = null;              // autowired
    this.managedFlyway = null;       // autowired — notes Flyway runner
    this.managedFlywayTags = null;   // autowired — tags Flyway runner
    this.noteRepository = null;      // autowired
    this.tagRepository = null;       // autowired
    this.appName = '${app.name:Multi-DB Example}';
  }

  async run() {
    this.logger.info(`[${this.appName}] Awaiting migrations on both databases`);

    // Both runners fire concurrently during CDI init — await both
    await Promise.all([
      this.managedFlyway.ready(),
      this.managedFlywayTags.ready(),
    ]);

    // Notes database
    const notesInfo = await this.managedFlyway.getFlyway().info();
    console.log('\n── Notes DB migration history ─────────────────────');
    notesInfo.forEach((m) => console.log(`  V${m.version} ${m.description.padEnd(30)} [${m.state}]`));

    // Tags database
    const tagsInfo = await this.managedFlywayTags.getFlyway().info();
    console.log('\n── Tags DB migration history ──────────────────────');
    tagsInfo.forEach((m) => console.log(`  V${m.version} ${m.description.padEnd(30)} [${m.state}]`));

    // Query notes
    const notes = await this.noteRepository.findAll();
    console.log('\n── Notes ──────────────────────────────────────────');
    notes.forEach((n) => console.log(`  [${n.id}] ${n.title}`));

    // Query tags
    const tags = await this.tagRepository.findAllTags();
    console.log('\n── Tags ───────────────────────────────────────────');
    tags.forEach((t) => console.log(`  [${t.id}] ${t.name}`));

    // Cross-database operation: tag note 1 as 'important' and 'work'
    const importantId = tags.find((t) => t.name === 'important').id;
    const workId = tags.find((t) => t.name === 'work').id;
    await this.tagRepository.tagNote(notes[0].id, importantId);
    await this.tagRepository.tagNote(notes[0].id, workId);

    const noteTags = await this.tagRepository.tagsForNote(notes[0].id);
    console.log(`\n── Tags on note [${notes[0].id}] ─────────────────────────`);
    noteTags.forEach((t) => console.log(`  ${t.name}`));

    console.log('\n── Done ───────────────────────────────────────────\n');
    this.logger.info(`[${this.appName}] Demo complete`);
  }
}
