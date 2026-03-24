/**
 * example-5-2-persistence-jsdbc — entry point
 *
 * Demonstrates @alt-javascript/boot-jsdbc: a single jsdbcTemplateStarter() call
 * auto-configures DataSource, JsdbcTemplate, and NamedParameterJsdbcTemplate
 * from jsdbc.* config properties. No manual DataSource wiring required.
 *
 * NoteRepository.jsdbcTemplate is autowired automatically by CDI.
 *
 * Config (config/application.json):
 *   jsdbc.url — "jsdbc:sqljs:memory" (sql.js WASM, runs without native deps)
 *
 * Run:
 *   npm start       # info log level (application.json)
 *   npm run start:dev  # debug log level (application-dev.json overlay)
 */
import '@alt-javascript/jsdbc-sqljs'; // self-registers SqlJsDriver with DriverManager

import { jsdbcTemplateStarter } from '@alt-javascript/boot-jsdbc';
import { Context, Singleton } from '@alt-javascript/cdi';
import { NoteRepository, Application } from './src/services.js';

const context = new Context([
  new Singleton(NoteRepository),
  new Singleton(Application),
]);

// jsdbcTemplateStarter() wraps Boot.boot() and appends jsdbcAutoConfiguration():
//   - Reads jsdbc.url from config
//   - Creates SingleConnectionDataSource (in-memory URL detected automatically)
//   - Registers dataSource, jsdbcTemplate, namedParameterJsdbcTemplate in CDI
//   - NoteRepository.jsdbcTemplate is autowired; init() creates schema + seeds data
//   - Application.run() is called during the CDI run phase
await jsdbcTemplateStarter({
  contexts: [context],
});
