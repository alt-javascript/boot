/**
 * example-4-1-intro-hono — entry point
 *
 * Same Boot.boot() pattern; swap honoAutoConfiguration().
 *
 * Notable: Hono uses the Web Standards Request/Response API, so it
 * runs unchanged on Node.js, Cloudflare Workers, Deno, and Bun.
 * The HonoAdapter uses @hono/node-server for local Node.js serving.
 *
 * Run:
 *   npm start           # http://localhost:3000
 *   npm run start:dev   # http://localhost:3001 (G'day greeting)
 */
import { Boot } from '@alt-javascript/boot';
import { Context, Singleton } from '@alt-javascript/cdi';
import { honoAutoConfiguration } from '@alt-javascript/boot-hono';
import { GreetingService, Application } from './src/services.js';
import { GreetingController } from './src/controllers.js';

const context = new Context([
  ...honoAutoConfiguration(),
  new Singleton(GreetingService),
  new Singleton(GreetingController),
  new Singleton(Application),
]);

await Boot.boot({ contexts: [context] });
