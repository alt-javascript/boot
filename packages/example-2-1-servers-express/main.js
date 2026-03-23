/**
 * example-2-1-servers-express — entry point
 *
 * Adds @alt-javascript/boot-express to the Boot.boot() pattern.
 * expressStarter() returns the CDI component definitions for
 * the ExpressAdapter — no manual server setup needed.
 *
 * Lifecycle (all managed by Boot.boot()):
 *   config → logger → banner
 *   → ApplicationContext.prepare() — wire + init all singletons
 *   → ApplicationContext.run() — ExpressAdapter.run() starts listening,
 *                                 Application.run() logs the URL
 *   → SIGINT → ApplicationContext.stop() → ExpressAdapter.destroy() closes server
 *
 * Run:
 *   npm start           # http://localhost:3000
 *   npm run start:dev   # http://localhost:3001 (G'day greeting)
 */
import { Boot } from '@alt-javascript/boot';
import { Context, Singleton } from '@alt-javascript/cdi';
import { expressStarter } from '@alt-javascript/boot-express';
import { GreetingService, Application } from './src/services.js';
import { GreetingController } from './src/controllers.js';

const context = new Context([
  ...expressStarter(),
  new Singleton(GreetingService),
  new Singleton(GreetingController),
  new Singleton(Application),
]);

await Boot.boot({ contexts: [context] });
