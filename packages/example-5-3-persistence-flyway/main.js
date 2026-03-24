/**
 * example-5-3-persistence-flyway — entry point
 *
 * Demonstrates @alt-javascript/boot-flyway: Flyway-inspired versioned SQL
 * migrations applied automatically on context start.
 *
 * Migration files (db/migration/):
 *   V1__create_notes_table.sql  — initial schema with created_at timestamp
 *   V2__add_priority_column.sql — schema evolution: adds priority column
 *   V3__seed_notes.sql          — seed data
 *
 * On start:
 *   1. jsdbcTemplateStarter registers DataSource, JsdbcTemplate beans
 *   2. flywayStarter registers ManagedFlyway which runs migrate() during init
 *   3. Application.run() awaits managedFlyway.ready() before querying
 *
 * Run:
 *   npm start
 */
import '@alt-javascript/jsdbc-sqljs';

import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { Context, Singleton } from '@alt-javascript/cdi';
import { jsdbcTemplateStarter } from '@alt-javascript/boot-jsdbc';
import { flywayStarter } from '@alt-javascript/boot-flyway';
import { NoteRepository, Application } from './src/services.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const MIGRATIONS = resolve(__dirname, 'db/migration');

const { applicationContext } = await jsdbcTemplateStarter({
  contexts: [
    new Context([
      ...flywayStarter(),
      new Singleton(NoteRepository),
      new Singleton(Application),
    ]),
  ],
  // Boot reads config/application.json; override locations to absolute path
  // so the example works from any cwd.
  config: {
    boot: {
      datasource: { url: 'jsdbc:sqljs:memory' },
      flyway: { locations: MIGRATIONS },
    },
  },
});

// Application.run() is invoked by the Boot lifecycle via CDI.
