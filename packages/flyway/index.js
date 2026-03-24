/**
 * @alt-javascript/flyway
 *
 * Flyway-inspired database migration engine for JavaScript/Node.js.
 *
 * Inspired by Flyway (https://flywaydb.org) by Redgate Software Ltd,
 * licensed under the Apache License 2.0. This package implements only
 * the open-source feature set: versioned migrations, checksum verification,
 * migration history tracking, baseline, repair, and clean.
 *
 * No premium or proprietary Flyway features are reproduced here.
 * Attribution: concepts and conventions (V__description.sql naming, flyway_schema_history
 * table structure, checksum approach) are derived from Flyway OSS.
 *
 * Standalone usage (no Boot/CDI required):
 *
 *   import { Flyway } from '@alt-javascript/flyway';
 *   import { DataSource } from '@alt-javascript/jsdbc-core';
 *   import '@alt-javascript/jsdbc-sqljs';
 *
 *   const flyway = new Flyway({
 *     dataSource: new DataSource({ url: 'jsdbc:sqljs:memory' }),
 *     locations: ['db/migration'],
 *   });
 *   await flyway.migrate();
 *
 * For CDI auto-configuration, use @alt-javascript/boot-flyway instead.
 */
export { Flyway, FlywayError, FlywayValidationError, FlywayMigrationError } from './Flyway.js';
export { MigrationLoader } from './MigrationLoader.js';
export { MigrationExecutor } from './MigrationExecutor.js';
export { SchemaHistoryTable } from './SchemaHistoryTable.js';
export { MigrationState, MigrationVersion } from './Migration.js';
