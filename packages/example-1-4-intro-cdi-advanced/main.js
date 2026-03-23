/**
 * example-1-4-intro-cdi-advanced — entry point
 *
 * Advanced CDI features: profile-conditional beans, prototype scope,
 * shared component name with primary resolution, dependsOn ordering,
 * setApplicationContext.
 *
 * Key concepts demonstrated here:
 *
 *   name: 'greetingStrategy'    — both strategy beans register under the same CDI name.
 *                                 Application.greetingStrategy null-wires to whichever is active.
 *
 *   primary: true               — when two active beans share a name, primary wins.
 *                                 Casual is profile-gated; when dev is active it wins;
 *                                 when dev is inactive only Formal is registered.
 *
 *   Prototype scope             — new ConnectionPool instance on each appCtx.get() call.
 *
 *   dependsOn                   — Application waits for MetricsService to init first.
 *
 * Run:
 *   npm start           # FormalGreetingStrategy (always active, no profile filter)
 *   npm run start:dev   # CasualGreetingStrategy (profiles: dev)
 *   npm run start:prod  # FormalGreetingStrategy (prod profile, casual filtered out)
 */
import { ApplicationContext, Context, Singleton, Prototype } from '@alt-javascript/cdi';
import {
  FormalGreetingStrategy,
  CasualGreetingStrategy,
  ConnectionPool,
  MetricsService,
  Application,
} from './src/services.js';

const context = new Context([
  // Both registered as 'greetingStrategy' — CDI resolves the active one.
  // CasualGreetingStrategy.profiles = ['dev'] means it's only parsed when dev is active.
  new Singleton({ Reference: FormalGreetingStrategy, name: 'greetingStrategy' }),
  new Singleton({ Reference: CasualGreetingStrategy, name: 'greetingStrategy', primary: true }),
  new Prototype(ConnectionPool),           // new instance per appCtx.get('connectionPool')
  new Singleton(MetricsService),
  new Singleton(Application),
]);

const appCtx = new ApplicationContext({ contexts: [context] });
await appCtx.start();
