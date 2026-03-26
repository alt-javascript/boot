/**
 * example-2-1-servers-express — controllers
 *
 * Demonstrates the declarative __routes pattern for controller registration.
 *
 * static __routes — ControllerRegistrar reads this array during init() and registers
 * each route on the Express app. Handlers are bound to the instance automatically,
 * so 'this' works correctly.
 *
 * Null-property autowiring gives controllers access to services and config.
 */

export class GreetingController {
  static qualifier = '@alt-javascript/example-2-1-servers-express/GreetingController';

  // Declarative route registration — no manual app.get() calls needed.
  static __routes = [
    { method: 'GET', path: '/',            handler: 'health' },
    { method: 'GET', path: '/greet/:name', handler: 'greet' },
    { method: 'GET', path: '/secret',      handler: 'secret' },
  ];

  constructor() {
    this.logger = null;           // autowired
    this.config = null;           // autowired
    this.greetingService = null;  // autowired
    this.appName = '${app.name:Express Example}';
    this.version = '${app.version:1.0.0}';
  }

  init() {
    this.logger.debug('GreetingController initialised');
  }

  health(req, res) {
    res.json({
      status: 'ok',
      app: this.appName,
      version: this.version,
    });
  }

  greet(req, res) {
    const { name } = req.params;
    const message = this.greetingService.greet(name);
    this.logger.debug(`GET /greet/${name} → ${message}`);
    res.json({ message });
  }

  secret(req, res) {
    // req.user is set by AuthMiddleware when a valid token is present
    const user = req.user || (req.request?.user);
    res.json({ secret: 'You found it!', user });
  }
}
