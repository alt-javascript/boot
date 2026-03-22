/**
 * example-4-intro-boot — entry point
 *
 * The full stack in one call. Boot.boot() handles:
 *   - Config loading (ProfileConfigLoader)
 *   - Logger infrastructure setup
 *   - Global root population (so CDI beans can autowire loggers)
 *   - Banner printing
 *   - ApplicationContext creation and lifecycle start
 *
 * Your main.js only needs to:
 *   1. Import the context definition
 *   2. Call Boot.boot({ contexts })
 *
 * Application.run() — defined in services.js — is the application entry point.
 * ApplicationContext calls it during the lifecycle run phase.
 *
 * Run:
 *   npm start               # Hello, World!  (text logs)
 *   npm run start:dev       # G'day, World!  (debug log level)
 *   npm run start:json-log  # Hello, World!  (JSON log lines)
 */
import { ProfileConfigLoader } from '@alt-javascript/config';
import { Boot } from '@alt-javascript/boot';
import { Context, Singleton } from '@alt-javascript/cdi';
import { GreetingRepository, GreetingService, Application } from './src/services.js';

const config = ProfileConfigLoader.load();

const context = new Context([
  new Singleton(GreetingRepository),
  new Singleton(GreetingService),
  new Singleton(Application),
]);

// One call does everything: boot → banner → ApplicationContext → run()
await Boot.boot({ config, contexts: [context] });
