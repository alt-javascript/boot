/**
 * SchemaHistoryTable — manages the flyway_schema_history tracking table.
 *
 * Flyway-inspired (https://flywaydb.org, Apache 2.0).
 * Mirrors the open-source Flyway schema history table structure:
 *   installed_rank, version, description, type, script, checksum,
 *   installed_by, installed_on, execution_time, success
 *
 * Table name is configurable (default: flyway_schema_history).
 * Uses JsdbcTemplate for all parameterized queries.
 */
import { JsdbcTemplate } from '@alt-javascript/jsdbc-template';
import { MigrationState } from './Migration.js';

export class SchemaHistoryTable {
  /**
   * @param {object} dataSource         — JSDBC DataSource
   * @param {string} [tableName]        — history table name (default: flyway_schema_history)
   */
  constructor(dataSource, tableName = 'flyway_schema_history') {
    this._dataSource = dataSource;
    this._tableName = tableName;
    this._template = new JsdbcTemplate(dataSource);
  }

  get tableName() {
    return this._tableName;
  }

  /**
   * Create the history table if it does not exist.
   */
  async provision() {
    await this._template.execute(`
      CREATE TABLE IF NOT EXISTS ${this._tableName} (
        installed_rank  INTEGER NOT NULL,
        version         TEXT,
        description     TEXT    NOT NULL,
        type            TEXT    NOT NULL DEFAULT 'SQL',
        script          TEXT    NOT NULL,
        checksum        INTEGER,
        installed_by    TEXT    NOT NULL DEFAULT 'flyway',
        installed_on    TEXT    NOT NULL,
        execution_time  INTEGER NOT NULL DEFAULT 0,
        success         INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (installed_rank)
      )
    `);
  }

  /**
   * Return all applied migration records, ordered by installed_rank.
   * @returns {Promise<Array>}
   */
  async findAll() {
    const rows = await this._template.queryForList(
      `SELECT * FROM ${this._tableName} ORDER BY installed_rank`,
    );
    return rows.map((r) => ({ ...r, success: r.success === 1 || r.success === true }));
  }

  /**
   * Return the maximum installed_rank, or 0 if empty.
   * @returns {Promise<number>}
   */
  async maxRank() {
    const row = await this._template.queryForObject(
      `SELECT COALESCE(MAX(installed_rank), 0) AS max_rank FROM ${this._tableName}`,
    );
    return row.max_rank ?? 0;
  }

  /**
   * Record a migration entry.
   * @param {object} entry
   * @returns {Promise<number>} installed_rank of the new row
   */
  async insert(entry) {
    const rank = (await this.maxRank()) + 1;
    await this._template.update(
      `INSERT INTO ${this._tableName}
         (installed_rank, version, description, type, script, checksum,
          installed_by, installed_on, execution_time, success)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        rank,
        entry.version ?? null,
        entry.description,
        entry.type ?? 'SQL',
        entry.script,
        entry.checksum ?? null,
        entry.installed_by ?? 'flyway',
        new Date().toISOString(),
        entry.execution_time ?? 0,
        entry.success ? 1 : 0,
      ],
    );
    return rank;
  }

  /**
   * Update success flag and execution_time for a row.
   * @param {number} rank
   * @param {boolean} success
   * @param {number} executionTime — ms
   */
  async updateSuccess(rank, success, executionTime) {
    await this._template.update(
      `UPDATE ${this._tableName} SET success = ?, execution_time = ? WHERE installed_rank = ?`,
      [success ? 1 : 0, executionTime, rank],
    );
  }

  /**
   * Delete all failed (success=0) rows. Used by repair().
   */
  async removeFailedEntries() {
    await this._template.update(
      `DELETE FROM ${this._tableName} WHERE success = 0`,
      [],
    );
  }

  /**
   * Drop the history table. Used by clean().
   */
  async drop() {
    await this._template.execute(`DROP TABLE IF EXISTS ${this._tableName}`);
  }

  /**
   * Insert a BASELINE record.
   * @param {string} version
   * @param {string} [description]
   */
  async insertBaseline(version, description = 'Flyway Baseline') {
    return this.insert({
      version,
      description,
      type: 'BASELINE',
      script: `<< ${description} >>`,
      checksum: null,
      success: true,
    });
  }
}
