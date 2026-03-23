/**
 * example-3-1-servers-fastify — entry point
 *
 * Identical Boot.boot() pattern to example-2-1-servers-express.
 * Swap expressStarter() → fastifyStarter().
 *
 * Run:
 *   npm start           # http://localhost:3000
 *   npm run start:dev   # http://localhost:3001 (G'day greeting)
 */
import { Boot } from '@alt-javascript/boot';
import { Context, Singleton } from '@alt-javascript/cdi';
import { fastifyStarter } from '@alt-javascript/boot-fastify';
import { GreetingService, Application } from './src/services.js';
import { GreetingController } from './src/controllers.js';

const context = new Context([
  ...fastifyStarter(),
  new Singleton(GreetingService),
  new Singleton(GreetingController),
  new Singleton(Application),
]);

await Boot.boot({ contexts: [context] });
