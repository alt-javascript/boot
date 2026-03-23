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

import { ApplicationContext, Context, Singleton } from '@alt-javascript/cdi';
import { GreetingRepository, GreetingService, Application } from './src/services.js';


// 1. Context — all components the container manages
const context = new Context([
  new Singleton(GreetingRepository),
  new Singleton(GreetingService),
  new Singleton(Application),
]);

// 2. ApplicationContext — wire, init, run
//    Application.run() (defined in services.js) is called during the lifecycle run phase.
//    Config and logging are defaulted in the ApplicationContext constructor, but not
//    added to the context by design.  They must be explicitly constructed
//    by the developer and manually wired in the context provided, if non-defaults are wanted.
const appCtx = new ApplicationContext({ contexts: [context] });
await appCtx.start();
