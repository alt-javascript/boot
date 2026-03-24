/**
 * example-5-5-persistence-nosql — services
 *
 * Demonstrates @alt-javascript/boot-jsnosqlc: jsnosqlcStarter() auto-configures
 * a NoSQL Client from boot.nosql.* config. No SQL, no schema — documents are
 * plain JavaScript objects stored and retrieved by key or filter.
 *
 * NoteRepository.nosqlClient is autowired by CDI.
 * The collection is accessed via client.getCollection('notes').
 *
 * NoSQL operations used:
 *   insert(doc)         — auto-assigned _id
 *   get(key)            — retrieve by _id
 *   update(key, patch)  — shallow merge (preserves untouched fields)
 *   delete(key)         — remove by _id
 *   find(filter)        — Filter.where(...).eq(...) query
 *   for await...of      — cursor iteration
 */
import { Filter } from '@alt-javascript/jsnosqlc-core';

const COLLECTION = 'notes';

/**
 * NoteRepository — CDI-managed document repository.
 *
 * Uses nosqlClient directly — no template layer needed.
 * nosqlClient.getCollection() returns a Collection; all operations
 * are natively document-oriented.
 */
export class NoteRepository {
  static qualifier = '@alt-javascript/example-5-5-persistence-nosql/NoteRepository';

  constructor() {
    this.logger = null;        // autowired
    this.nosqlClient = null;   // autowired from jsnosqlcStarter()
  }

  async init() {
    this.logger.info('NoteRepository.init() — NoSQL, no schema required');
  }

  _col() {
    return this.nosqlClient.getCollection(COLLECTION);
  }

  /** @returns {Promise<string>} assigned _id */
  async save(title, body = '', tags = []) {
    return this._col().insert({ title, body, tags, done: false, createdAt: new Date().toISOString() });
  }

  /** @returns {Promise<Object|null>} */
  async findById(id) {
    return this._col().get(id);
  }

  /** @returns {Promise<Array>} all notes */
  async findAll() {
    // Empty filter matches everything
    const cursor = await this._col().find({ type: 'and', conditions: [] });
    return cursor.getDocuments();
  }

  /** @returns {Promise<Array>} notes containing the given tag */
  async findByTag(tag) {
    const cursor = await this._col().find(
      Filter.where('tags').contains(tag).build(),
    );
    return cursor.getDocuments();
  }

  /** @returns {Promise<Array>} incomplete notes */
  async findPending() {
    const cursor = await this._col().find(
      Filter.where('done').eq(false).build(),
    );
    return cursor.getDocuments();
  }

  /** @returns {Promise<void>} */
  async markDone(id) {
    return this._col().update(id, { done: true });
  }

  /** @returns {Promise<void>} */
  async remove(id) {
    return this._col().delete(id);
  }
}

/**
 * Application — lifecycle entry point.
 */
export class Application {
  static qualifier = '@alt-javascript/example-5-5-persistence-nosql/Application';

  constructor() {
    this.logger = null;          // autowired
    this.nosqlClient = null;     // autowired — for ready()
    this.noteRepository = null;  // autowired
    this.appName = '${app.name:NoSQL Example}';
  }

  async run() {
    this.logger.info(`[${this.appName}] Awaiting NoSQL client`);
    await this.nosqlClient.ready();

    // Insert some notes
    const id1 = await this.noteRepository.save('Learn jsnosqlc', 'NoSQL driver abstraction.', ['learning', 'nosql']);
    const id2 = await this.noteRepository.save('Try the memory driver', 'Zero deps, CI-safe.', ['nosql', 'testing']);
    const id3 = await this.noteRepository.save('Explore multi-client', 'See example-5-6.', ['learning']);

    console.log('\n── All notes ──────────────────────────────────────');
    const all = await this.noteRepository.findAll();
    all.forEach((n) => console.log(`  [${n._id.slice(-6)}] ${n.title}  tags:${n.tags.join(',')}`));

    // Query by tag
    const nosqlNotes = await this.noteRepository.findByTag('nosql');
    console.log(`\n── Tagged 'nosql' (${nosqlNotes.length} notes) ─────────────────────`);
    nosqlNotes.forEach((n) => console.log(`  ${n.title}`));

    // Mark one done
    await this.noteRepository.markDone(id1);
    const pending = await this.noteRepository.findPending();
    console.log(`\n── Pending (${pending.length} notes) ──────────────────────────────`);
    pending.forEach((n) => console.log(`  ○ ${n.title}`));

    // Update (patch — preserves other fields)
    await this.noteRepository._col().update(id2, { body: 'Updated body text.' });
    const updated = await this.noteRepository.findById(id2);
    console.log(`\n── Updated note body: "${updated.body}"`);

    // Delete
    await this.noteRepository.remove(id3);
    console.log(`\n── After delete: ${(await this.noteRepository.findAll()).length} notes remain`);

    console.log('\n── Done ───────────────────────────────────────────\n');
    this.logger.info(`[${this.appName}] Demo complete`);
  }
}
