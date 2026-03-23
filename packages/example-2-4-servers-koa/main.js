/**
 * example-2-4-servers-koa — entry point
 *
 * Same Boot.boot() pattern; swap koaStarter().
 *
 * Koa is the async/await successor to Express — no callbacks, clean
 * middleware composition via async/await. Service and controller code
 * is identical to all other examples.
 *
 * Run:
 *   npm start           # http://localhost:3000
 *   npm run start:dev   # http://localhost:3001 (G'day greeting)
 */
import { Boot } from '@alt-javascript/boot';
import { Context, Singleton } from '@alt-javascript/cdi';
import { koaStarter } from '@alt-javascript/boot-koa';
import { GreetingService, Application } from './src/services.js';
import { GreetingController } from './src/controllers.js';

const context = new Context([
  ...koaStarter(),
  new Singleton(GreetingService),
  new Singleton(GreetingController),
  new Singleton(Application),
]);

await Boot.boot({ contexts: [context] });
