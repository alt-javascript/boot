/**
 * @alt-javascript/flyway — test suite
 *
 * Uses @alt-javascript/jsdbc-sqljs (in-memory, zero native deps).
 * Migration files in test/fixtures/db/migration/.
 */
import { assert } from 'chai';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import '@alt-javascript/jsdbc-sqljs';
import { SingleConnectionDataSource } from '@alt-javascript/jsdbc-core';

import {
  Flyway,
  FlywayValidationError,
  FlywayMigrationError,
  MigrationLoader,
  MigrationExecutor,
  SchemaHistoryTable,
  MigrationState,
  MigrationVersion,
} from '../index.js';
import { checksum } from '../MigrationLoader.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const FIXTURES = resolve(__dirname, 'fixtures');
const MIGRATIONS = resolve(FIXTURES, 'db/migration');
const MIGRATIONS2 = resolve(FIXTURES, 'db/migration2');

function newDs() {
  return new SingleConnectionDataSource({ url: 'jsdbc:sqljs:memory' });
}

// ── MigrationVersion ──────────────────────────────────────────────────────

describe('@alt-javascript/flyway', () => {

  describe('MigrationVersion', () => {

    it('parses single-segment versions', () => {
      assert.equal(MigrationVersion.parse('1').toString(), '1');
      assert.equal(MigrationVersion.parse('10').toString(), '10');
    });

    it('parses multi-segment versions', () => {
      assert.equal(MigrationVersion.parse('1.1').toString(), '1.1');
      assert.equal(MigrationVersion.parse('2.0.0').toString(), '2.0.0');
    });

    it('compares versions numerically', () => {
      assert.isBelow(MigrationVersion.parse('1').compareTo(MigrationVersion.parse('2')), 0);
      assert.isAbove(MigrationVersion.parse('2').compareTo(MigrationVersion.parse('1')), 0);
      assert.equal(MigrationVersion.parse('1').compareTo(MigrationVersion.parse('1')), 0);
    });

    it('compares multi-segment versions correctly (1 < 1.1 < 2 < 10)', () => {
      const v = ['10', '2', '1.1', '1'].map(MigrationVersion.parse);
      v.sort((a, b) => a.compareTo(b));
      assert.deepEqual(v.map(String), ['1', '1.1', '2', '10']);
    });

  });

  // ── checksum ──────────────────────────────────────────────────────────────

  describe('checksum()', () => {

    it('returns same value for same content', () => {
      assert.equal(checksum('SELECT 1'), checksum('SELECT 1'));
    });

    it('returns different values for different content', () => {
      assert.notEqual(checksum('SELECT 1'), checksum('SELECT 2'));
    });

    it('returns a 32-bit integer', () => {
      const c = checksum('hello world');
      assert.isNumber(c);
      assert.isTrue(c >= -2147483648 && c <= 2147483647);
    });

  });

  // ── MigrationLoader ───────────────────────────────────────────────────────

  describe('MigrationLoader', () => {

    it('loads versioned migrations from a directory', () => {
      const loader = new MigrationLoader([MIGRATIONS]);
      const migrations = loader.load();
      assert.equal(migrations.length, 3);
    });

    it('returns migrations sorted by version ascending', () => {
      const loader = new MigrationLoader([MIGRATIONS]);
      const migrations = loader.load();
      assert.deepEqual(migrations.map((m) => m.version.toString()), ['1', '2', '3']);
    });

    it('parses description from filename', () => {
      const loader = new MigrationLoader([MIGRATIONS]);
      const [first] = loader.load();
      assert.equal(first.description, 'create notes table');
    });

    it('loads and merges from multiple locations sorted by version', () => {
      const loader = new MigrationLoader([MIGRATIONS, MIGRATIONS2]);
      const migrations = loader.load();
      assert.equal(migrations.length, 4);
      assert.deepEqual(
        migrations.map((m) => m.version.toString()),
        ['1', '1.1', '2', '3'],
      );
    });

    it('silently returns empty array for non-existent location', () => {
      const loader = new MigrationLoader(['/does/not/exist']);
      assert.deepEqual(loader.load(), []);
    });

    it('attaches a checksum to each migration', () => {
      const loader = new MigrationLoader([MIGRATIONS]);
      const migrations = loader.load();
      migrations.forEach((m) => {
        assert.isNumber(m.checksum);
      });
    });

  });

  // ── SchemaHistoryTable ────────────────────────────────────────────────────

  describe('SchemaHistoryTable', () => {

    it('provision() creates the history table', async () => {
      const ds = newDs();
      const history = new SchemaHistoryTable(ds);
      await history.provision();
      const rows = await history.findAll();
      assert.isArray(rows);
      assert.equal(rows.length, 0);
    });

    it('provision() is idempotent', async () => {
      const ds = newDs();
      const history = new SchemaHistoryTable(ds);
      await history.provision();
      await history.provision(); // should not throw
      assert.equal((await history.findAll()).length, 0);
    });

    it('insert() and findAll() round-trip a record', async () => {
      const ds = newDs();
      const history = new SchemaHistoryTable(ds);
      await history.provision();
      await history.insert({
        version: '1',
        description: 'create notes',
        script: 'V1__create_notes.sql',
        checksum: 42,
        success: true,
      });
      const rows = await history.findAll();
      assert.equal(rows.length, 1);
      assert.equal(rows[0].version, '1');
      assert.equal(rows[0].description, 'create notes');
      assert.equal(rows[0].success, true);
    });

    it('maxRank() returns 0 when empty', async () => {
      const ds = newDs();
      const history = new SchemaHistoryTable(ds);
      await history.provision();
      assert.equal(await history.maxRank(), 0);
    });

    it('maxRank() increments correctly', async () => {
      const ds = newDs();
      const history = new SchemaHistoryTable(ds);
      await history.provision();
      await history.insert({ version: '1', description: 'a', script: 'V1.sql', success: true });
      await history.insert({ version: '2', description: 'b', script: 'V2.sql', success: true });
      assert.equal(await history.maxRank(), 2);
    });

    it('removeFailedEntries() removes only failed rows', async () => {
      const ds = newDs();
      const history = new SchemaHistoryTable(ds);
      await history.provision();
      await history.insert({ version: '1', description: 'ok', script: 'V1.sql', success: true });
      await history.insert({ version: '2', description: 'fail', script: 'V2.sql', success: false });
      await history.removeFailedEntries();
      const rows = await history.findAll();
      assert.equal(rows.length, 1);
      assert.equal(rows[0].version, '1');
    });

    it('insertBaseline() records a BASELINE entry', async () => {
      const ds = newDs();
      const history = new SchemaHistoryTable(ds);
      await history.provision();
      await history.insertBaseline('1', 'Test Baseline');
      const rows = await history.findAll();
      assert.equal(rows.length, 1);
      assert.equal(rows[0].type, 'BASELINE');
      assert.equal(rows[0].version, '1');
      assert.equal(rows[0].success, true);
    });

    it('uses a custom table name', async () => {
      const ds = newDs();
      const history = new SchemaHistoryTable(ds, 'my_migrations');
      await history.provision();
      assert.equal(history.tableName, 'my_migrations');
      assert.equal((await history.findAll()).length, 0);
    });

  });

  // ── MigrationExecutor ─────────────────────────────────────────────────────

  describe('MigrationExecutor', () => {

    it('executes a multi-statement SQL string', async () => {
      const ds = newDs();
      const conn = await ds.getConnection();
      const executor = new MigrationExecutor();
      await executor.execute(conn, `
        CREATE TABLE ex_test (id INTEGER PRIMARY KEY, val TEXT);
        INSERT INTO ex_test VALUES (1, 'hello');
      `);
      const ps = await conn.prepareStatement('SELECT * FROM ex_test');
      const rs = await ps.executeQuery();
      rs.next();
      assert.equal(rs.getString('val'), 'hello');
    });

    it('strips line comments', async () => {
      const ds = newDs();
      const conn = await ds.getConnection();
      const executor = new MigrationExecutor();
      await executor.execute(conn, `
        -- this is a comment
        CREATE TABLE ex_test2 (id INTEGER PRIMARY KEY);
        -- another comment
      `);
      // No error = pass
    });

  });

  // ── Flyway.migrate() ─────────────────────────────────────────────────────

  describe('Flyway.migrate()', () => {

    it('applies all pending migrations and returns count', async () => {
      const flyway = new Flyway({ dataSource: newDs(), locations: [MIGRATIONS] });
      const result = await flyway.migrate();
      assert.equal(result.migrationsExecuted, 3);
      assert.equal(result.appliedMigrations.length, 3);
    });

    it('all applied migrations have state SUCCESS', async () => {
      const flyway = new Flyway({ dataSource: newDs(), locations: [MIGRATIONS] });
      const { appliedMigrations } = await flyway.migrate();
      appliedMigrations.forEach((m) => assert.equal(m.state, MigrationState.SUCCESS));
    });

    it('records migrations in the schema history table', async () => {
      const ds = newDs();
      const flyway = new Flyway({ dataSource: ds, locations: [MIGRATIONS] });
      await flyway.migrate();
      const history = new SchemaHistoryTable(ds);
      const rows = await history.findAll();
      assert.equal(rows.length, 3);
      assert.isTrue(rows.every((r) => r.success));
    });

    it('is idempotent — second migrate() applies nothing', async () => {
      const ds = newDs();
      const flyway = new Flyway({ dataSource: ds, locations: [MIGRATIONS] });
      await flyway.migrate();
      const second = await flyway.migrate();
      assert.equal(second.migrationsExecuted, 0);
    });

    it('actually creates the schema (tables exist after migration)', async () => {
      const ds = newDs();
      const flyway = new Flyway({ dataSource: ds, locations: [MIGRATIONS] });
      await flyway.migrate();
      const conn = await ds.getConnection();
      const ps = await conn.prepareStatement('SELECT COUNT(*) AS cnt FROM notes');
      const rs = await ps.executeQuery();
      rs.next();
      assert.equal(rs.getInt('cnt'), 2, 'V3 seed migration should have inserted 2 rows');
    });

    it('merges migrations from multiple locations', async () => {
      const flyway = new Flyway({
        dataSource: newDs(),
        locations: [MIGRATIONS, MIGRATIONS2],
      });
      const result = await flyway.migrate();
      assert.equal(result.migrationsExecuted, 4);
    });

    it('throws FlywayMigrationError on bad SQL', async () => {
      const ds = newDs();
      const flyway = new Flyway({ dataSource: ds, locations: [MIGRATIONS] });
      // Inject a bad migration by overriding loader
      flyway._loader = { load: () => [{
        version: { toString: () => '99', compareTo: () => 1, _segments: [99] },
        description: 'bad migration',
        script: 'V99__bad.sql',
        sql: 'THIS IS NOT VALID SQL !!!',
        checksum: 0,
        type: 'SQL',
      }]};
      try {
        await flyway.migrate();
        assert.fail('should have thrown');
      } catch (err) {
        assert.equal(err.name, 'FlywayMigrationError');
      }
    });

  });

  // ── Flyway.info() ─────────────────────────────────────────────────────────

  describe('Flyway.info()', () => {

    it('returns PENDING for all migrations before migrate()', async () => {
      const flyway = new Flyway({ dataSource: newDs(), locations: [MIGRATIONS] });
      const info = await flyway.info();
      assert.equal(info.length, 3);
      info.forEach((m) => assert.equal(m.state, MigrationState.PENDING));
    });

    it('returns SUCCESS for applied, PENDING for unapplied', async () => {
      const ds = newDs();
      const flyway = new Flyway({ dataSource: ds, locations: [MIGRATIONS] });
      // Apply only V1 by temporarily hiding V2, V3
      flyway._loader = { load: () => new MigrationLoader([MIGRATIONS]).load().slice(0, 1) };
      await flyway.migrate();

      // Restore full loader for info()
      flyway._loader = new MigrationLoader([MIGRATIONS]);
      const info = await flyway.info();
      assert.equal(info.find((m) => m.version === '1').state, MigrationState.SUCCESS);
      assert.equal(info.find((m) => m.version === '2').state, MigrationState.PENDING);
      assert.equal(info.find((m) => m.version === '3').state, MigrationState.PENDING);
    });

  });

  // ── Flyway.validate() ────────────────────────────────────────────────────

  describe('Flyway.validate()', () => {

    it('passes when checksums match', async () => {
      const ds = newDs();
      const flyway = new Flyway({ dataSource: ds, locations: [MIGRATIONS] });
      await flyway.migrate();
      await flyway.validate(); // should not throw
    });

    it('throws FlywayValidationError when checksum drifts', async () => {
      const ds = newDs();
      const flyway = new Flyway({ dataSource: ds, locations: [MIGRATIONS] });
      await flyway.migrate();

      // Tamper: change checksum in the loaded migration (simulates file edit)
      flyway._loader = {
        load: () => new MigrationLoader([MIGRATIONS]).load().map((m, i) =>
          i === 0 ? { ...m, checksum: m.checksum + 1 } : m,
        ),
      };

      try {
        await flyway.validate();
        assert.fail('should have thrown');
      } catch (err) {
        assert.equal(err.name, 'FlywayValidationError');
        assert.include(err.message, 'checksum mismatch');
      }
    });

  });

  // ── Flyway.baseline() ────────────────────────────────────────────────────

  describe('Flyway.baseline()', () => {

    it('inserts a BASELINE history entry', async () => {
      const ds = newDs();
      const flyway = new Flyway({ dataSource: ds, locations: [MIGRATIONS], baselineVersion: '0' });
      await flyway.baseline();
      const history = new SchemaHistoryTable(ds);
      const rows = await history.findAll();
      assert.equal(rows.length, 1);
      assert.equal(rows[0].type, 'BASELINE');
    });

    it('throws if history is not empty', async () => {
      const ds = newDs();
      const flyway = new Flyway({ dataSource: ds, locations: [MIGRATIONS] });
      await flyway.migrate();
      try {
        await flyway.baseline();
        assert.fail('should have thrown');
      } catch (err) {
        assert.equal(err.name, 'FlywayError');
      }
    });

  });

  // ── Flyway.repair() ───────────────────────────────────────────────────────

  describe('Flyway.repair()', () => {

    it('removes failed entries and reports count', async () => {
      const ds = newDs();
      const history = new SchemaHistoryTable(ds);
      await history.provision();
      await history.insert({ version: '1', description: 'ok', script: 'V1.sql', success: true });
      await history.insert({ version: '2', description: 'fail', script: 'V2.sql', success: false });

      const flyway = new Flyway({ dataSource: ds, locations: [MIGRATIONS] });
      const result = await flyway.repair();
      assert.equal(result.removedEntries, 1);
      assert.equal((await history.findAll()).length, 1);
    });

  });

  // ── Flyway.clean() ────────────────────────────────────────────────────────

  describe('Flyway.clean()', () => {

    it('drops the schema history table', async () => {
      const ds = newDs();
      const flyway = new Flyway({ dataSource: ds, locations: [MIGRATIONS] });
      await flyway.migrate();
      await flyway.clean();
      // After clean, provision() should recreate it (empty)
      const history = new SchemaHistoryTable(ds);
      await history.provision();
      assert.equal((await history.findAll()).length, 0);
    });

  });

});
