/**
 * example-5-6-persistence-nosql-multidb — entry point
 *
 * Two independent jsnosqlc clients in one ApplicationContext:
 *   nosqlClient   (boot.nosql.*)          — user document store
 *   sessionClient (boot.nosql-sessions.*) — session token store
 *
 * Run:
 *   npm start
 */
import '@alt-javascript/jsnosqlc-memory';

import { Context, Singleton } from '@alt-javascript/cdi';
import { jsnosqlcBoot, NoSqlClientBuilder } from '@alt-javascript/boot-jsnosqlc';
import { UserRepository, SessionRepository, Application } from './src/services.js';

// Secondary client: sessionClient wired from boot.nosql-sessions.*
const sessionComponents = NoSqlClientBuilder.create()
  .prefix('boot.nosql-sessions')
  .beanNames({ clientDataSource: 'sessionClientDataSource', client: 'sessionClient' })
  .build();

await jsnosqlcBoot({
  contexts: [
    new Context([
      ...sessionComponents,
      new Singleton(UserRepository),
      new Singleton(SessionRepository),
      new Singleton(Application),
    ]),
  ],
});
