/**
 * example-5-3-persistence-flyway — services
 *
 * Demonstrates @alt-javascript/boot-flyway: versioned SQL migrations applied
 * automatically on application start via flywayStarter().
 *
 * Schema ownership:
 *   db/migration/V1__create_notes_table.sql — initial schema
 *   db/migration/V2__add_priority_column.sql — schema evolution
 *   db/migration/V3__seed_notes.sql — seed data
 *
 * NoteRepository.jsdbcTemplate is autowired by CDI.
 * No DDL lives in application code — Flyway owns the schema lifecycle.
 */

/**
 * NoteRepository — CDI-managed repository backed by JsdbcTemplate.
 *
 * Flyway has already applied all migrations by the time this bean's
 * init() is called (managedFlyway.dependsOn is implicit via boot ordering).
 * In practice callers must await managedFlyway.ready() before querying.
 */
export class NoteRepository {
  static qualifier = '@alt-javascript/example-5-3-persistence-flyway/NoteRepository';

  constructor() {
    this.logger = null;        // autowired
    this.jsdbcTemplate = null; // autowired from jsdbcTemplateStarter()
  }

  /** @returns {Promise<Array>} all notes ordered by priority, then id */
  async findAll() {
    return this.jsdbcTemplate.queryForList(
      'SELECT * FROM notes ORDER BY priority DESC, id',
      [],
      (row) => ({
        id: row.id,
        title: row.title,
        body: row.body,
        done: !!row.done,
        priority: row.priority,
        createdAt: row.created_at,
      }),
    );
  }

  /** @returns {Promise<Object>} single note by ID */
  async findById(id) {
    return this.jsdbcTemplate.queryForObject(
      'SELECT * FROM notes WHERE id = ?', [id],
      (row) => ({
        id: row.id,
        title: row.title,
        body: row.body,
        done: !!row.done,
        priority: row.priority,
      }),
    );
  }

  /** @returns {Promise<number>} generated ID */
  async save(title, body = '', priority = 0) {
    await this.jsdbcTemplate.update(
      'INSERT INTO notes (title, body, priority) VALUES (?, ?, ?)',
      [title, body, priority],
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
 * Application — lifecycle entry point.
 *
 * Demonstrates Flyway-managed schema + NoteRepository in action.
 * Awaits managedFlyway.ready() before querying to ensure migrations
 * have fully applied (CDI does not await async init()).
 */
export class Application {
  static qualifier = '@alt-javascript/example-5-3-persistence-flyway/Application';

  constructor() {
    this.logger = null;          // autowired
    this.managedFlyway = null;   // autowired — needed for ready()
    this.noteRepository = null;  // autowired
    this.appName = '${app.name:Flyway Example}';
  }

  async run() {
    this.logger.info(`[${this.appName}] Awaiting Flyway migrations`);
    await this.managedFlyway.ready();

    const info = await this.managedFlyway.getFlyway().info();
    console.log('\n── Migration history ──────────────────────────────');
    info.forEach((m) => console.log(`  V${m.version} ${m.description.padEnd(35)} [${m.state}]`));

    const notes = await this.noteRepository.findAll();
    console.log('\n── Notes (seeded by V3 migration) ────────────────');
    notes.forEach((n) => console.log(`  [${n.id}] P${n.priority} ${n.title}`));

    const newId = await this.noteRepository.save('Runtime note', 'Added after migration.', 0);
    this.logger.info(`Created note id=${newId}`);

    await this.noteRepository.markDone(notes[0].id);
    const updated = await this.noteRepository.findAll();
    console.log('\n── After update ───────────────────────────────────');
    updated.forEach((n) => console.log(`  [${n.id}] ${n.done ? '✓' : '○'} ${n.title}`));

    console.log('\n── Done ───────────────────────────────────────────\n');
    this.logger.info(`[${this.appName}] Demo complete`);
  }
}
