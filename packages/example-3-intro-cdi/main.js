/**
 * example-3-intro-cdi — entry point
 *
 * Introduces ApplicationContext and CDI patterns.
 * Shows manual logger infrastructure setup and how Boot.boot() ties it together.
 *
 * Key CDI patterns shown in src/services.js:
 *   - static qualifier       — logger category name per class
 *   - Property injection     — '${config.path:default}' resolved from config
 *   - Null-property wiring   — null properties matched to CDI components by name
 *   - Application.run()      — lifecycle entry point, not main.js
 *
 * Run:
 *   npm start           # Hello, World!
 *   npm run start:dev   # G'day, World!
 */
import { ProfileConfigLoader } from '@alt-javascript/config';
import { LoggerFactory, LoggerCategoryCache } from '@alt-javascript/logger';
import { Boot } from '@alt-javascript/boot';
import { ApplicationContext, Context, Singleton } from '@alt-javascript/cdi';
import { GreetingRepository, GreetingService, Application } from './src/services.js';

// 1. Config
const config = ProfileConfigLoader.load();

// 2. Logger infrastructure — built manually here to show what Boot.boot() automates.
//    In example-4, Boot.boot() handles this in one call.
const loggerCategoryCache = new LoggerCategoryCache();
const loggerFactory = new LoggerFactory(config, loggerCategoryCache);

// 3. Populate the global root so CDI can autowire loggers into beans.
//    Boot.boot() without contexts just does setup — no ApplicationContext started here.
Boot.boot({ config, loggerFactory, loggerCategoryCache });

// 4. Context — all components the container manages
const context = new Context([
  new Singleton(GreetingRepository),
  new Singleton(GreetingService),
  new Singleton(Application),
]);

// 5. ApplicationContext — wire, init, run
//    Application.run() (defined in services.js) is called during the lifecycle run phase.
const appCtx = new ApplicationContext({ contexts: [context], config });
await appCtx.start();
