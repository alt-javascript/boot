/**
 * MigrationLoader — discovers and parses versioned SQL migration files.
 *
 * Flyway-inspired (https://flywaydb.org, Apache 2.0).
 * Naming convention: V{version}__{description}.sql
 *   e.g. V1__create_notes_table.sql
 *        V1.1__add_index.sql
 *        V2__seed_data.sql
 *
 * Files are sorted by version (numeric, segment-aware) before return.
 * Repeatable migrations (R__description.sql) are not yet supported.
 */
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { MigrationVersion } from './Migration.js';

/** Matches: V{version}__{description}.sql */
const VERSIONED_PATTERN = /^V([0-9]+(?:\.[0-9]+)*)__(.+)\.sql$/i;

/**
 * Compute a simple CRC32-style checksum of a string.
 * Derived from the standard CRC32 polynomial — not a cryptographic hash.
 * Used only for drift detection (matches Flyway's intent, not its exact impl).
 *
 * @param {string} str
 * @returns {number} signed 32-bit integer
 */
export function checksum(str) {
  let crc = 0xFFFFFFFF;
  const buf = Buffer.from(str, 'utf8');
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) | 0; // signed 32-bit
}

export class MigrationLoader {
  /**
   * @param {string[]} locations — filesystem paths to scan for migration files
   */
  constructor(locations = ['db/migration']) {
    this.locations = Array.isArray(locations) ? locations : [locations];
  }

  /**
   * Load all versioned migrations from all configured locations.
   * Files are sorted by version ascending.
   *
   * @returns {Array<Migration>}
   */
  load() {
    const migrations = [];

    for (const loc of this.locations) {
      if (!existsSync(loc)) continue;

      const files = readdirSync(loc).filter((f) => VERSIONED_PATTERN.test(f));
      for (const file of files) {
        const match = file.match(VERSIONED_PATTERN);
        const versionRaw = match[1];
        const description = match[2].replace(/_/g, ' ');
        const filePath = join(loc, file);
        const sql = readFileSync(filePath, 'utf8');

        migrations.push({
          version: MigrationVersion.parse(versionRaw),
          description,
          script: file,
          sql,
          checksum: checksum(sql),
          type: 'SQL',
        });
      }
    }

    // Sort by version ascending
    migrations.sort((a, b) => a.version.compareTo(b.version));
    return migrations;
  }
}
