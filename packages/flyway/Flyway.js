/**
 * Flyway — database migration engine.
 *
 * Inspired by Flyway (https://flywaydb.org) by Redgate Software Ltd,
 * Apache License 2.0. Implements the open-source feature set only:
 *
 *   migrate()    — apply all pending versioned migrations
 *   info()       — return migration status report
 *   validate()   — detect checksum drift between files and history
 *   baseline()   — mark current database state as a known baseline
 *   repair()     — remove failed migration records from history table
 *   clean()      — drop all objects managed by flyway (destructive)
 *
 * NOT implemented (premium/proprietary features): undo, dry-run, batched
 * execution, cherry-pick, teams/enterprise features.
 *
 * Conventions (Flyway OSS naming):
 *   V{version}__{description}.sql   — versioned migration
 *   flyway_schema_history            — default history table name
 *
 * Usage:
 *   const flyway = new Flyway({ dataSource, locations: ['db/migration'] });
 *   const result = await flyway.migrate();
 *   // result: { migrationsExecuted, appliedMigrations: [...] }
 */
import { MigrationLoader } from './MigrationLoader.js';
import { MigrationExecutor } from './MigrationExecutor.js';
import { SchemaHistoryTable } from './SchemaHistoryTable.js';
import { MigrationState, MigrationVersion } from './Migration.js';

export class Flyway {
  /**
   * @param {object}   options
   * @param {object}   options.dataSource          — JSDBC DataSource instance (required)
   * @param {string[]} [options.locations]          — migration file paths (default: ['db/migration'])
   * @param {string}   [options.table]              — history table name (default: 'flyway_schema_history')
   * @param {string}   [options.baselineVersion]    — version to use for baseline() (default: '1')
   * @param {string}   [options.baselineDescription] — baseline description
   * @param {boolean}  [options.outOfOrder]         — allow out-of-order migrations (default: false)
   * @param {boolean}  [options.validateOnMigrate]  — validate checksums before migrating (default: true)
   * @param {string}   [options.installedBy]        — user recorded in history (default: 'flyway')
   */
  constructor(options = {}) {
    if (!options.dataSource) {
      throw new Error('Flyway requires a dataSource');
    }
    this._dataSource = options.dataSource;
    this._locations = options.locations ?? ['db/migration'];
    this._table = options.table ?? 'flyway_schema_history';
    this._baselineVersion = options.baselineVersion ?? '1';
    this._baselineDescription = options.baselineDescription ?? 'Flyway Baseline';
    this._outOfOrder = options.outOfOrder ?? false;
    this._validateOnMigrate = options.validateOnMigrate ?? true;
    this._installedBy = options.installedBy ?? 'flyway';

    this._loader = new MigrationLoader(this._locations);
    this._executor = new MigrationExecutor();
    this._history = new SchemaHistoryTable(this._dataSource, this._table);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Apply all pending migrations in version order.
   *
   * @returns {Promise<{migrationsExecuted: number, appliedMigrations: Array}>}
   * @throws {FlywayValidationError} if validateOnMigrate=true and checksums differ
   * @throws {FlywayMigrationError}  if a migration SQL fails
   */
  async migrate() {
    await this._history.provision();

    const available = this._loader.load();
    const applied = await this._history.findAll();

    if (this._validateOnMigrate) {
      this._validate(available, applied);
    }

    const pending = this._pending(available, applied);
    const appliedMigrations = [];

    for (const migration of pending) {
      const start = Date.now();
      const rank = await this._history.insert({
        version: migration.version.toString(),
        description: migration.description,
        script: migration.script,
        checksum: migration.checksum,
        installed_by: this._installedBy,
        success: false,
      });

      try {
        const conn = await this._dataSource.getConnection();
        await this._executor.execute(conn, migration.sql);
        const elapsed = Date.now() - start;
        await this._history.updateSuccess(rank, true, elapsed);
        appliedMigrations.push({
          version: migration.version.toString(),
          description: migration.description,
          script: migration.script,
          executionTime: elapsed,
          state: MigrationState.SUCCESS,
        });
      } catch (err) {
        await this._history.updateSuccess(rank, false, Date.now() - start);
        throw new FlywayMigrationError(migration, err);
      }
    }

    return { migrationsExecuted: appliedMigrations.length, appliedMigrations };
  }

  /**
   * Return a status report for all migrations (applied + pending).
   *
   * @returns {Promise<Array<MigrationInfo>>}
   */
  async info() {
    await this._history.provision();
    const available = this._loader.load();
    const applied = await this._history.findAll();

    const appliedByVersion = Object.fromEntries(
      applied.filter((r) => r.version).map((r) => [r.version, r]),
    );

    return available.map((m) => {
      const rec = appliedByVersion[m.version.toString()];
      let state;
      if (!rec) {
        state = MigrationState.PENDING;
      } else if (rec.success) {
        state = MigrationState.SUCCESS;
      } else {
        state = MigrationState.FAILED;
      }
      return {
        version: m.version.toString(),
        description: m.description,
        script: m.script,
        checksum: m.checksum,
        state,
        installedOn: rec?.installed_on ?? null,
        executionTime: rec?.execution_time ?? null,
      };
    });
  }

  /**
   * Validate that applied migration checksums match the files on disk.
   * Throws FlywayValidationError on mismatch.
   *
   * @returns {Promise<void>}
   */
  async validate() {
    await this._history.provision();
    const available = this._loader.load();
    const applied = await this._history.findAll();
    this._validate(available, applied);
  }

  /**
   * Mark the current state of the database as a baseline.
   * All existing migrations up to baselineVersion are recorded as already applied
   * without actually running them.
   *
   * @returns {Promise<void>}
   */
  async baseline() {
    await this._history.provision();
    const applied = await this._history.findAll();
    if (applied.length > 0) {
      throw new FlywayError(
        'Cannot baseline a non-empty schema history. Use repair() to clear failed entries first.',
      );
    }
    await this._history.insertBaseline(this._baselineVersion, this._baselineDescription);
  }

  /**
   * Remove failed migration entries from the history table.
   * Safe to call at any time — does not touch the database schema.
   *
   * @returns {Promise<{removedEntries: number}>}
   */
  async repair() {
    await this._history.provision();
    const before = await this._history.findAll();
    const failedBefore = before.filter((r) => !r.success).length;
    await this._history.removeFailedEntries();
    return { removedEntries: failedBefore };
  }

  /**
   * Drop the flyway schema history table.
   * DESTRUCTIVE — does not drop application tables; only removes migration tracking.
   * Use with caution; intended for development/test environments.
   *
   * @returns {Promise<void>}
   */
  async clean() {
    await this._history.drop();
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  /**
   * Determine which migrations are pending (not yet successfully applied).
   */
  _pending(available, applied) {
    const appliedVersions = new Set(
      applied.filter((r) => r.success && r.version).map((r) => r.version),
    );
    const pending = available.filter(
      (m) => !appliedVersions.has(m.version.toString()),
    );
    if (!this._outOfOrder) {
      const successfulVersions = applied
        .filter((r) => r.success && r.version)
        .map((r) => r.version);
      if (successfulVersions.length > 0) {
        const sorted = successfulVersions
          .map((v) => MigrationVersion.parse(v))
          .sort((a, b) => a.compareTo(b));
        const maxApplied = sorted[sorted.length - 1];
        return pending.filter((m) => m.version.compareTo(maxApplied) > 0);
      }
    }
    return pending;
  }

  /**
   * Check all applied migrations have matching checksums on disk.
   * @throws {FlywayValidationError}
   */
  _validate(available, applied) {
    const availableByVersion = Object.fromEntries(
      available.map((m) => [m.version.toString(), m]),
    );
    for (const rec of applied) {
      if (!rec.version || rec.type === 'BASELINE') continue;
      if (!rec.success) continue;
      const file = availableByVersion[rec.version];
      if (!file) continue; // file deleted — warn-only (not an error in OSS Flyway without cleanDisabled)
      if (file.checksum !== rec.checksum) {
        throw new FlywayValidationError(
          `Migration checksum mismatch for version ${rec.version} (${rec.script}). ` +
          `Expected ${rec.checksum}, got ${file.checksum}. ` +
          'The migration file was modified after it was applied.',
        );
      }
    }
  }
}

// ── Error types ───────────────────────────────────────────────────────────

export class FlywayError extends Error {
  constructor(message) {
    super(message);
    this.name = 'FlywayError';
  }
}

export class FlywayValidationError extends FlywayError {
  constructor(message) {
    super(message);
    this.name = 'FlywayValidationError';
  }
}

export class FlywayMigrationError extends FlywayError {
  constructor(migration, cause) {
    super(`Migration ${migration.script} failed: ${cause.message}`);
    this.name = 'FlywayMigrationError';
    this.migration = migration;
    this.cause = cause;
  }
}
