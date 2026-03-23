/**
 * example-1-4-intro-cdi-advanced — services
 *
 * Demonstrates advanced CDI features beyond the basics in example-1-3:
 *
 *   Prototype scope       — new instance per injection (vs Singleton: shared instance)
 *
 *   Profile-conditional   — static profiles = ['dev'] activates a component only when
 *                           NODE_ACTIVE_PROFILES includes that profile. Use for
 *                           environment-specific implementations.
 *
 *   dependsOn             — explicit init ordering when natural dependency order isn't enough.
 *
 *   properties            — explicit property wiring via Component.properties array,
 *                           for cases where null-property name matching doesn't apply.
 *
 *   primary               — marks the preferred bean when multiple implementations exist
 *                           for the same property name.
 *
 *   setApplicationContext — called by CDI after wiring; gives a bean access to the full
 *                           container for dynamic lookups.
 */

/**
 * GreetingStrategy — interface (by convention).
 * Two profile-conditional implementations follow.
 * Both register under the same CDI component name ('greetingStrategy').
 * primary=true on both means "prefer this one if both are active".
 * In practice, CasualGreetingStrategy is only active on dev profile,
 * so it wins when dev is active; FormalGreetingStrategy wins otherwise.
 */
export class FormalGreetingStrategy {
  static qualifier = '@alt-javascript/example-1-4-intro-cdi-advanced/FormalGreetingStrategy';
  // name: 'greetingStrategy' set in main.js Singleton registration — both strategies share
  // this name so Application.greetingStrategy null-wires correctly.

  constructor() {
    this.logger = null; // autowired
  }

  greet(name) {
    return `Good day, ${name}.`;
  }
}

export class CasualGreetingStrategy {
  static qualifier = '@alt-javascript/example-1-4-intro-cdi-advanced/CasualGreetingStrategy';
  // Only activated when NODE_ACTIVE_PROFILES includes 'dev'.
  static profiles = ['dev'];

  constructor() {
    this.logger = null;
  }

  greet(name) {
    return `Hey ${name}!`;
  }
}

/**
 * ConnectionPool — Prototype-scoped.
 * Each get('connectionPool') call produces a fresh instance.
 * Demonstrates scope=prototype for stateful or non-shared resources.
 */
export class ConnectionPool {
  static qualifier = '@alt-javascript/example-1-4-intro-cdi-advanced/ConnectionPool';
  static scope = 'prototype'; // new instance per injection

  constructor() {
    this.logger = null;
    this.maxConnections = '${app.maxConnections:5}'; // property injection
    this.host = '${db.host:localhost}';
    this.port = '${db.port:5432}';
    this._id = Math.random().toString(36).slice(2, 6); // unique per instance
  }

  init() {
    this.logger.info(`ConnectionPool[${this._id}] init — host:${this.host} port:${this.port} max:${this.maxConnections}`);
  }
}

/**
 * MetricsService — demonstrates setApplicationContext().
 * Called by CDI after wiring completes. Lets a bean do dynamic lookups
 * at runtime without declaring them as null properties upfront.
 */
export class MetricsService {
  static qualifier = '@alt-javascript/example-1-4-intro-cdi-advanced/MetricsService';

  constructor() {
    this.logger = null;  // autowired
    this.appCtx = null;  // set by setApplicationContext()
  }

  setApplicationContext(appCtx) {
    this.appCtx = appCtx;
  }

  init() {
    this.logger.info('MetricsService initialised with ApplicationContext reference');
  }

  report() {
    // Dynamic lookup at call time — not declared as a property
    const pool1 = this.appCtx.get('connectionPool');
    const pool2 = this.appCtx.get('connectionPool');
    this.logger.info(`Prototype scope: pool1.id=${pool1._id} pool2.id=${pool2._id} same=${pool1 === pool2}`);
  }
}

/**
 * Application — lifecycle entry point.
 * dependsOn ensures MetricsService is initialised before Application.
 */
export class Application {
  static qualifier = '@alt-javascript/example-1-4-intro-cdi-advanced/Application';
  static dependsOn = ['metricsService']; // explicit init order

  constructor() {
    this.logger = null;          // autowired
    this.config = null;          // autowired
    this.greetingStrategy = null; // autowired — primary bean wins
    this.metricsService = null;   // autowired
    this.appName = '${app.name:CDI Advanced Example}';
  }

  run() {
    this.logger.info(`[${this.appName}] Running`);
    console.log(this.greetingStrategy.greet('World'));
    console.log(this.greetingStrategy.greet('Alt-JavaScript'));
    this.metricsService.report();
  }
}
