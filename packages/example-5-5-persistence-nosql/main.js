/**
 * example-5-5-persistence-nosql — entry point
 *
 * Demonstrates @alt-javascript/boot-jsnosqlc with the in-memory driver.
 * A single jsnosqlcStarter() call auto-configures the nosqlClient bean.
 *
 * Run:
 *   npm start
 */
import '@alt-javascript/jsnosqlc-memory'; // self-registers MemoryDriver with DriverManager

import { Context, Singleton } from '@alt-javascript/cdi';
import { jsnosqlcBoot } from '@alt-javascript/boot-jsnosqlc';
import { NoteRepository, Application } from './src/services.js';

await jsnosqlcBoot({
  contexts: [
    new Context([
      new Singleton(NoteRepository),
      new Singleton(Application),
    ]),
  ],
});
