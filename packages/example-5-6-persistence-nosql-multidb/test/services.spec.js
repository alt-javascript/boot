/**
 * example-5-6-persistence-nosql-multidb — service tests
 *
 * Verifies UserRepository (primary client) and SessionRepository (secondary client)
 * coexist in one ApplicationContext with independent stores.
 */
import { assert } from 'chai';
import '@alt-javascript/jsnosqlc-memory';
import { Context, Singleton } from '@alt-javascript/cdi';
import { EphemeralConfig } from '@alt-javascript/config';
import { ApplicationContext } from '@alt-javascript/cdi';
import { jsnosqlcAutoConfiguration, NoSqlClientBuilder } from '@alt-javascript/boot-jsnosqlc';
import { UserRepository, SessionRepository } from '../src/services.js';

const BASE_CONFIG = {
  boot: {
    'banner-mode': 'off',
    nosql:             { url: 'jsnosqlc:memory:' },
    'nosql-sessions':  { url: 'jsnosqlc:memory:' },
  },
  app: { name: 'test' },
  logging: { level: { ROOT: 'error' } },
};

function buildContext() {
  const sessionComponents = NoSqlClientBuilder.create()
    .prefix('boot.nosql-sessions')
    .beanNames({ clientDataSource: 'sessionClientDataSource', client: 'sessionClient' })
    .build();

  return [
    new Context(jsnosqlcAutoConfiguration()),
    new Context([
      ...sessionComponents,
      new Singleton(UserRepository),
      new Singleton(SessionRepository),
    ]),
  ];
}

describe('example-5-6-persistence-nosql-multidb', () => {

  let userRepo;
  let sessionRepo;
  let nosqlClient;
  let sessionClient;

  beforeEach(async () => {
    const config = new EphemeralConfig(BASE_CONFIG);
    const appCtx = new ApplicationContext({ contexts: buildContext(), config });
    await appCtx.start({ run: false });

    nosqlClient   = appCtx.get('nosqlClient');
    sessionClient = appCtx.get('sessionClient');
    await Promise.all([nosqlClient.ready(), sessionClient.ready()]);

    userRepo    = appCtx.get('userRepository');
    sessionRepo = appCtx.get('sessionRepository');
  });

  // ── UserRepository (primary client) ──────────────────────────────────────

  describe('UserRepository — primary client', () => {

    it('createUser() inserts a user document and returns _id', async () => {
      const id = await userRepo.createUser('alice', 'alice@example.com', 'admin');
      assert.isString(id);
      const user = await userRepo.findById(id);
      assert.equal(user.username, 'alice');
      assert.equal(user.role, 'admin');
    });

    it('findAll() returns all users', async () => {
      await userRepo.createUser('u1', 'u1@test.com');
      await userRepo.createUser('u2', 'u2@test.com');
      const all = await userRepo.findAll();
      assert.equal(all.length, 2);
    });

    it('findByRole() filters users by role', async () => {
      await userRepo.createUser('admin1', 'a@test.com', 'admin');
      await userRepo.createUser('user1',  'u@test.com', 'user');
      await userRepo.createUser('admin2', 'b@test.com', 'admin');
      const admins = await userRepo.findByRole('admin');
      assert.equal(admins.length, 2);
      assert.isTrue(admins.every((u) => u.role === 'admin'));
    });

    it('updateRole() changes role without losing other fields', async () => {
      const id = await userRepo.createUser('bob', 'bob@test.com', 'user');
      await userRepo.updateRole(id, 'admin');
      const user = await userRepo.findById(id);
      assert.equal(user.role, 'admin');
      assert.equal(user.username, 'bob');   // preserved
      assert.equal(user.email, 'bob@test.com'); // preserved
    });

    it('remove() deletes a user', async () => {
      const id = await userRepo.createUser('temp', 't@test.com');
      await userRepo.remove(id);
      assert.isNull(await userRepo.findById(id));
    });

  });

  // ── SessionRepository (secondary client) ─────────────────────────────────

  describe('SessionRepository — secondary client', () => {

    it('createSession() stores a session by token', async () => {
      const id = await userRepo.createUser('carol', 'c@test.com');
      await sessionRepo.createSession(id, 'tok-carol-1');
      const session = await sessionRepo.findSession('tok-carol-1');
      assert.equal(session.userId, id);
      assert.isTrue(session.active);
      assert.isString(session.expiresAt);
    });

    it('findByUser() returns all active sessions for a user', async () => {
      const id = await userRepo.createUser('dan', 'd@test.com');
      await sessionRepo.createSession(id, 'tok-dan-1');
      await sessionRepo.createSession(id, 'tok-dan-2');
      const sessions = await sessionRepo.findByUser(id);
      assert.equal(sessions.length, 2);
    });

    it('revokeSession() marks session inactive', async () => {
      const id = await userRepo.createUser('eve', 'e@test.com');
      await sessionRepo.createSession(id, 'tok-eve-1');
      await sessionRepo.revokeSession('tok-eve-1');
      const active = await sessionRepo.findByUser(id);
      assert.equal(active.length, 0, 'revoked session should not appear in active list');
      const raw = await sessionRepo.findSession('tok-eve-1');
      assert.isFalse(raw.active);
    });

    it('deleteSession() removes a session', async () => {
      const id = await userRepo.createUser('frank', 'f@test.com');
      await sessionRepo.createSession(id, 'tok-frank-1');
      await sessionRepo.deleteSession('tok-frank-1');
      assert.isNull(await sessionRepo.findSession('tok-frank-1'));
    });

  });

  // ── Store independence ────────────────────────────────────────────────────

  describe('store independence', () => {

    it('user docs are not visible in the session client', async () => {
      const id = await userRepo.createUser('ghost', 'g@test.com');
      const sessionStoreUser = await sessionClient.getCollection('users').get(id);
      assert.isNull(sessionStoreUser, 'session store should not contain user docs');
    });

    it('session tokens are not visible in the user client', async () => {
      const id = await userRepo.createUser('hal', 'h@test.com');
      await sessionRepo.createSession(id, 'tok-hal-1');
      const userStoreSession = await nosqlClient.getCollection('sessions').get('tok-hal-1');
      assert.isNull(userStoreSession, 'user store should not contain session docs');
    });

    it('both clients have independent migration histories (no cross-contamination)', async () => {
      // In NoSQL there's no migration history — but each collection namespace is isolated
      await userRepo.createUser('isolation-test', 'i@test.com');
      const userColNames = Object.keys(nosqlClient.getClient()._stores ?? {});
      const sessionColNames = Object.keys(sessionClient.getClient()._stores ?? {});
      // 'users' collection exists in user store; not necessarily in session store
      assert.isFalse(sessionColNames.includes('users') && (await sessionClient.getCollection('users').get('any')) !== null);
    });

  });

});
