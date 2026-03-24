/**
 * example-5-6-persistence-nosql-multidb — services
 *
 * Demonstrates multi-client NoSQL: two independent jsnosqlc clients in one
 * ApplicationContext, each with their own collection namespace.
 *
 * Client layout:
 *   nosqlClient       — primary (boot.nosql.*)     — user documents
 *   sessionClient     — secondary (boot.nosql-sessions.*) — session tokens
 *
 * UserRepository.nosqlClient   is autowired — stores user profiles
 * SessionRepository.sessionClient is autowired — stores ephemeral sessions
 *
 * This mirrors the SQL multi-datasource pattern (example-5-4) but for NoSQL:
 * two logically separate stores, each managed by its own Client bean.
 * In production the URLs would point to different databases or namespaces;
 * here both use jsnosqlc:memory: for CI safety.
 */
import { Filter } from '@alt-javascript/jsnosqlc-core';

// ---------------------------------------------------------------------------
// UserRepository — backed by the primary nosqlClient
// ---------------------------------------------------------------------------

export class UserRepository {
  static qualifier = '@alt-javascript/example-5-6-persistence-nosql-multidb/UserRepository';

  constructor() {
    this.logger = null;        // autowired
    this.nosqlClient = null;   // autowired — primary client
  }

  _col() {
    return this.nosqlClient.getCollection('users');
  }

  /** @returns {Promise<string>} assigned _id */
  async createUser(username, email, role = 'user') {
    return this._col().insert({ username, email, role, createdAt: new Date().toISOString() });
  }

  /** @returns {Promise<Object|null>} */
  async findById(id) {
    return this._col().get(id);
  }

  /** @returns {Promise<Array>} users with the given role */
  async findByRole(role) {
    const cursor = await this._col().find(Filter.where('role').eq(role).build());
    return cursor.getDocuments();
  }

  /** @returns {Promise<Array>} all users */
  async findAll() {
    const cursor = await this._col().find({ type: 'and', conditions: [] });
    return cursor.getDocuments();
  }

  /** @returns {Promise<void>} */
  async updateRole(id, role) {
    return this._col().update(id, { role });
  }

  /** @returns {Promise<void>} */
  async remove(id) {
    return this._col().delete(id);
  }
}

// ---------------------------------------------------------------------------
// SessionRepository — backed by the secondary sessionClient
// ---------------------------------------------------------------------------

export class SessionRepository {
  static qualifier = '@alt-javascript/example-5-6-persistence-nosql-multidb/SessionRepository';

  constructor() {
    this.logger = null;           // autowired
    this.sessionClient = null;    // autowired — secondary client
  }

  _col() {
    return this.sessionClient.getCollection('sessions');
  }

  /**
   * Create a session for a user (keyed by token).
   * @returns {Promise<string>} session token
   */
  async createSession(userId, token) {
    const expiresAt = new Date(Date.now() + 3_600_000).toISOString(); // +1h
    await this._col().store(token, { userId, token, expiresAt, active: true });
    return token;
  }

  /** @returns {Promise<Object|null>} session by token */
  async findSession(token) {
    return this._col().get(token);
  }

  /** @returns {Promise<Array>} all active sessions for a userId */
  async findByUser(userId) {
    const cursor = await this._col().find(
      Filter.where('userId').eq(userId).and('active').eq(true).build(),
    );
    return cursor.getDocuments();
  }

  /** @returns {Promise<void>} */
  async revokeSession(token) {
    return this._col().update(token, { active: false });
  }

  /** @returns {Promise<void>} */
  async deleteSession(token) {
    return this._col().delete(token);
  }
}

// ---------------------------------------------------------------------------
// Application — lifecycle entry point
// ---------------------------------------------------------------------------

export class Application {
  static qualifier = '@alt-javascript/example-5-6-persistence-nosql-multidb/Application';

  constructor() {
    this.logger = null;              // autowired
    this.nosqlClient = null;         // autowired — for ready()
    this.sessionClient = null;       // autowired — for ready()
    this.userRepository = null;      // autowired
    this.sessionRepository = null;   // autowired
    this.appName = '${app.name:Multi-Client NoSQL Example}';
  }

  async run() {
    this.logger.info(`[${this.appName}] Awaiting both NoSQL clients`);
    await Promise.all([this.nosqlClient.ready(), this.sessionClient.ready()]);

    // Create users (primary store)
    const aliceId = await this.userRepository.createUser('alice', 'alice@example.com', 'admin');
    const bobId   = await this.userRepository.createUser('bob',   'bob@example.com',   'user');
    const carolId = await this.userRepository.createUser('carol', 'carol@example.com', 'user');

    const users = await this.userRepository.findAll();
    console.log('\n── Users (primary store) ─────────────────────────');
    users.forEach((u) => console.log(`  [${u._id.slice(-6)}] ${u.username} (${u.role})`));

    // Create sessions (secondary store)
    await this.sessionRepository.createSession(aliceId, 'tok-alice-1');
    await this.sessionRepository.createSession(aliceId, 'tok-alice-2');
    await this.sessionRepository.createSession(bobId,   'tok-bob-1');

    const aliceSessions = await this.sessionRepository.findByUser(aliceId);
    console.log(`\n── Alice's sessions (secondary store) ────────────`);
    aliceSessions.forEach((s) => console.log(`  ${s.token}  active:${s.active}`));

    // Revoke one session
    await this.sessionRepository.revokeSession('tok-alice-1');
    const activeSessions = await this.sessionRepository.findByUser(aliceId);
    console.log(`\n── Active sessions after revoke: ${activeSessions.length}`);

    // Promote bob to admin (primary store — independent of sessions)
    await this.userRepository.updateRole(bobId, 'admin');
    const admins = await this.userRepository.findByRole('admin');
    console.log(`\n── Admins: ${admins.map((u) => u.username).join(', ')}`);

    // Verify stores are independent — user doc not in session store
    const sessionStoreHasUser = await this.sessionClient.getCollection('users').get(aliceId);
    console.log(`\n── Session store has user doc: ${sessionStoreHasUser !== null} (expected: false)`);

    console.log('\n── Done ───────────────────────────────────────────\n');
    this.logger.info(`[${this.appName}] Demo complete`);
  }
}
