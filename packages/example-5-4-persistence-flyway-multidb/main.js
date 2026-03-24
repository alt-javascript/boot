/**
 * example-5-4-persistence-flyway-multidb — entry point
 *
 * Multi-database deployment: two independent DataSources, each with its own
 * JsdbcTemplate and Flyway migration runner, all in one ApplicationContext.
 *
 * Primary datasource (boot.datasource.*):
 *   beans: dataSource, jsdbcTemplate, namedParameterJsdbcTemplate
 *   flyway: boot.flyway.* → managedFlyway (notes migrations)
 *
 * Secondary datasource (boot.datasource-tags.*):
 *   beans: tagsDataSource, tagsJsdbcTemplate, tagsNamedParameterJsdbcTemplate
 *   flyway: boot.flyway-tags.* → managedFlywayTags (tags migrations)
 *
 * Both Flyway runners start concurrently during CDI init().
 * Application.run() awaits both via Promise.all([mf.ready(), mft.ready()]).
 *
 * Run:
 *   npm start
 */
import '@alt-javascript/jsdbc-sqljs';

import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { Context, Singleton } from '@alt-javascript/cdi';
import { jsdbcTemplateStarter, DataSourceBuilder } from '@alt-javascript/boot-jsdbc';
import { flywayStarter } from '@alt-javascript/boot-flyway';
import { NoteRepository, TagRepository, Application } from './src/services.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const NOTES_MIGRATIONS = resolve(__dirname, 'db/notes-migration');
const TAGS_MIGRATIONS  = resolve(__dirname, 'db/tags-migration');

// Secondary datasource component definitions:
//   tagsDataSource, tagsJsdbcTemplate, tagsNamedParameterJsdbcTemplate
const tagsComponents = DataSourceBuilder.create()
  .prefix('boot.datasource-tags')
  .beanNames({
    dataSource:                 'tagsDataSource',
    jsdbcTemplate:              'tagsJsdbcTemplate',
    namedParameterJsdbcTemplate:'tagsNamedParameterJsdbcTemplate',
    schemaInitializer:          'tagsSchemaInitializer',
  })
  .withoutSchemaInitializer() // Flyway owns the tags schema
  .build();

// Secondary Flyway runner for the tags database.
// prefix 'boot.flyway-tags' separates config from the primary flyway config.
const tagsFlywayComponents = flywayStarter({
  prefix:         'boot.flyway-tags',
  datasourceBean: 'tagsDataSource',
});

// Rename the managedFlyway produced by the tags runner to managedFlywayTags
// so it coexists with the primary managedFlyway in the same context.
const tagsFlywayComponentsRenamed = tagsFlywayComponents.map((c) =>
  c.name === 'managedFlyway' ? { ...c, name: 'managedFlywayTags' } : c,
);

const { applicationContext } = await jsdbcTemplateStarter({
  contexts: [
    new Context([
      // Primary Flyway runner (notes DB) — default prefix boot.flyway
      ...flywayStarter(),
      // Secondary datasource stack (tags DB)
      ...tagsComponents,
      // Tags Flyway runner (renamed to managedFlywayTags)
      ...tagsFlywayComponentsRenamed,
      // Application repositories and entry point
      new Singleton(NoteRepository),
      new Singleton(TagRepository),
      new Singleton(Application),
    ]),
  ],
  config: {
    boot: {
      'banner-mode': 'off',
      datasource: { url: 'jsdbc:sqljs:memory' },
      'datasource-tags': { url: 'jsdbc:sqljs:memory' },
      flyway: { locations: NOTES_MIGRATIONS },
      'flyway-tags': {
        locations: TAGS_MIGRATIONS,
        enabled: true,
      },
    },
    app: { name: 'Multi-DB Flyway Example' },
    logging: { level: { ROOT: 'info' } },
  },
});
