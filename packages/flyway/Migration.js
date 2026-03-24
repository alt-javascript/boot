/**
 * Migration — value types for versioned migration records.
 *
 * Inspired by Flyway OSS (Apache 2.0) — https://flywaydb.org
 */

/**
 * Migration states (mirrors Flyway OSS state names).
 */
export const MigrationState = Object.freeze({
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  BASELINE: 'BASELINE',
});

/**
 * Parsed migration version — wraps a semver-style version string.
 *
 * Flyway convention: V{major}__{description}.sql
 * Versions are compared numerically segment by segment: 1 < 1.1 < 2 < 10.
 */
export class MigrationVersion {
  /**
   * @param {string} raw — e.g. '1', '1.1', '2.0.0'
   */
  constructor(raw) {
    this.raw = raw;
    this._segments = String(raw).split('.').map(Number);
  }

  /**
   * Compare two MigrationVersions. Returns negative if this < other,
   * positive if this > other, 0 if equal.
   * @param {MigrationVersion} other
   * @returns {number}
   */
  compareTo(other) {
    const a = this._segments;
    const b = other._segments;
    const len = Math.max(a.length, b.length);
    for (let i = 0; i < len; i++) {
      const diff = (a[i] ?? 0) - (b[i] ?? 0);
      if (diff !== 0) return diff;
    }
    return 0;
  }

  toString() {
    return this.raw;
  }

  static parse(raw) {
    return new MigrationVersion(raw);
  }
}

/**
 * Parsed migration file descriptor.
 *
 * @typedef {object} Migration
 * @property {MigrationVersion} version
 * @property {string}           description — human-readable from filename
 * @property {string}           script      — original filename
 * @property {string}           sql         — file contents
 * @property {number}           checksum    — CRC32-style hash of sql content
 * @property {string}           type        — 'SQL'
 */
