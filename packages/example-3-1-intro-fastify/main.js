/**
 * example-3-1-intro-fastify — entry point
 *
 * Identical Boot.boot() pattern to example-2-1-intro-express.
 * Swap expressAutoConfiguration() → fastifyAutoConfiguration().
 *
 * Run:
 *   npm start           # http://localhost:3000
 *   npm run start:dev   # http://localhost:3001 (G'day greeting)
 */
import { Boot } from '@alt-javascript/boot';
import { Context, Singleton } from '@alt-javascript/cdi';
import { fastifyAutoConfiguration } from '@alt-javascript/boot-fastify';
import { GreetingService, Application } from './src/services.js';
import { GreetingController } from './src/controllers.js';

const context = new Context([
  ...fastifyAutoConfiguration(),
  new Singleton(GreetingService),
  new Singleton(GreetingController),
  new Singleton(Application),
]);

await Boot.boot({ contexts: [context] });
