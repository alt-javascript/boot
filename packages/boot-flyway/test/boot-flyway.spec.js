/**
 * @alt-javascript/boot-flyway — CDI integration tests.
 *
 * Verifies ManagedFlyway wires to the dataSource bean and runs migrate()
 * during CDI context start.
 */
import { assert } from 'chai';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import '@alt-javascript/jsdbc-sqljs';
import { Context, Singleton } from '@alt-javascript/cdi';
import { jsdbcTemplateStarter } from '@alt-javascript/boot-jsdbc';
import {
  flywayStarter,
  ManagedFlyway,
  DEFAULT_FLYWAY_PREFIX,
} from '../index.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const MIGRATIONS = resolve(__dirname, 'fixtures/db/migration');

const BASE_CONFIG = (extra = {}) => ({
  boot: {
    'banner-mode': 'off',
    datasource: { url: 'jsdbc:sqljs:memory' },
    flyway: { locations: MIGRATIONS, ...extra },
  },
  app: { name: 'boot-flyway-test' },
  logging: { level: { ROOT: 'error' } },
});

describe('@alt-javascript/boot-flyway', () => {

  describe('DEFAULT_FLYWAY_PREFIX', () => {
    it('is boot.flyway', () => {
      assert.equal(DEFAULT_FLYWAY_PREFIX, 'boot.flyway');
    });
  });

  describe('flywayStarter()', () => {

    it('returns a component definition array', () => {
      const components = flywayStarter();
      assert.isArray(components);
      assert.isAbove(components.length, 0);
      components.forEach((c) => {
        assert.isString(c.name);
        assert.exists(c.Reference);
      });
    });

    it('includes a managedFlyway component', () => {
      const names = flywayStarter().map((c) => c.name);
      assert.include(names, 'managedFlyway');
    });

  });

  describe('CDI integration — migrate() on start', () => {

    it('runs all pending migrations when context starts', async () => {
      const { applicationContext } = await jsdbcTemplateStarter({
        config: BASE_CONFIG(),
        contexts: [new Context(flywayStarter())],
      });

      const managedFlyway = applicationContext.get('managedFlyway');
      assert.instanceOf(managedFlyway, ManagedFlyway);
      await managedFlyway.ready();

      const flyway = managedFlyway.getFlyway();
      assert.isNotNull(flyway);

      const info = await flyway.info();
      info.forEach((m) => assert.equal(m.state, 'SUCCESS'));
    });

    it('schema is applied — users table exists with seeded rows', async () => {
      const { applicationContext } = await jsdbcTemplateStarter({
        config: BASE_CONFIG(),
        contexts: [new Context(flywayStarter())],
      });

      await applicationContext.get('managedFlyway').ready();
      const template = applicationContext.get('jsdbcTemplate');
      const users = await template.queryForList('SELECT * FROM users ORDER BY id');
      assert.equal(users.length, 2);
      assert.equal(users[0].username, 'alice');
      assert.equal(users[1].username, 'bob');
    });

    it('migration history table is populated', async () => {
      const { applicationContext } = await jsdbcTemplateStarter({
        config: BASE_CONFIG(),
        contexts: [new Context(flywayStarter())],
      });

      await applicationContext.get('managedFlyway').ready();
      const template = applicationContext.get('jsdbcTemplate');
      const rows = await template.queryForList(
        'SELECT * FROM flyway_schema_history ORDER BY installed_rank',
      );
      assert.equal(rows.length, 2);
      assert.isTrue(rows.every((r) => r.success === 1));
    });

    it('second context start is idempotent — no re-migration', async () => {
      const config = BASE_CONFIG();

      const first = await jsdbcTemplateStarter({
        config,
        contexts: [new Context(flywayStarter())],
      });
      const mf = first.applicationContext.get('managedFlyway');
      await mf.ready();

      const infoAfterFirst = await mf.getFlyway().info();
      assert.isTrue(infoAfterFirst.every((m) => m.state === 'SUCCESS'));

      const secondResult = await mf.getFlyway().migrate();
      assert.equal(secondResult.migrationsExecuted, 0);
    });

    it('boot.flyway.enabled = false suppresses migration', async () => {
      const { applicationContext } = await jsdbcTemplateStarter({
        config: BASE_CONFIG({ enabled: false }),
        contexts: [new Context(flywayStarter())],
      });

      // managedFlyway bean should not be registered when disabled
      const managedFlyway = applicationContext.get('managedFlyway', null);
      assert.isNull(managedFlyway);
    });

    it('custom table name is respected', async () => {
      const { applicationContext } = await jsdbcTemplateStarter({
        config: BASE_CONFIG({ table: 'my_migrations' }),
        contexts: [new Context(flywayStarter())],
      });

      await applicationContext.get('managedFlyway').ready();
      const template = applicationContext.get('jsdbcTemplate');
      const rows = await template.queryForList(
        'SELECT * FROM my_migrations ORDER BY installed_rank',
      );
      assert.equal(rows.length, 2);
    });

    it('wires to a named secondary datasource via datasourceBean option', async () => {
      const { applicationContext } = await jsdbcTemplateStarter({
        config: {
          boot: {
            'banner-mode': 'off',
            datasource: { url: 'jsdbc:sqljs:memory' },
            flyway: { locations: MIGRATIONS },
          },
          app: { name: 'multi-ds-flyway-test' },
          logging: { level: { ROOT: 'error' } },
        },
        contexts: [
          new Context([
            ...flywayStarter({ datasourceBean: 'dataSource' }),
          ]),
        ],
      });

      await applicationContext.get('managedFlyway').ready();
      const users = await applicationContext.get('jsdbcTemplate')
        .queryForList('SELECT * FROM users');
      assert.equal(users.length, 2);
    });

  });

});
