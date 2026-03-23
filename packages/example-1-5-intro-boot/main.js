/**
 * example-1-5-intro-boot — entry point
 *
 * The full stack in one call. Boot.boot() handles:
 *   - Config loading (ProfileConfigLoader default)
 *   - Logger infrastructure setup
 *   - Root context injection into CDI (config, loggerFactory, loggerCategoryCache)
 *   - Banner printing
 *   - ApplicationContext creation and lifecycle start
 *
 * Your main.js only needs to:
 *   1. Define your context
 *   2. Call Boot.boot({ contexts })
 *
 * Application.run() — defined in services.js — is the application entry point.
 * ApplicationContext calls it during the lifecycle run phase.
 *
 * Config and logging are defaulted by Boot.boot() and injected into the ApplicationContext
 * as a root context — beans can autowire config, loggerFactory, etc. without manual setup.
 * Override by passing explicit config or loggerFactory to Boot.boot().
 *
 * Run:
 *   npm start               # Hello, World!  (text logs)
 *   npm run start:dev       # G'day, World!  (debug log level)
 *   npm run start:json-log  # Hello, World!  (JSON log lines)
 */
import { Boot } from '@alt-javascript/boot';
import { Context, Singleton } from '@alt-javascript/cdi';
import { GreetingRepository, GreetingService, Application } from './src/services.js';

const context = new Context([
  new Singleton(GreetingRepository),
  new Singleton(GreetingService),
  new Singleton(Application),
]);

// One call does everything: config → logger → banner → root context → ApplicationContext → run()
await Boot.boot({ contexts: [context] });
