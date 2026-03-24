/**
 * example-5-1-advanced — services
 *
 * Demonstrates advanced @alt-javascript/cdi features in one runnable example:
 *
 *   1. BeanPostProcessor   — intercepts every bean after init(); wraps services
 *                            with an AOP timing proxy when audit.enabled is true.
 *
 *   2. AOP (createProxy)   — Proxy-based around-advice that measures method
 *                            execution time and logs it.
 *
 *   3. Application Events  — OrderService publishes an OrderPlacedEvent;
 *                            AuditService listens via onApplicationEvent().
 *
 *   4. Conditional beans   — DevOnlyGreeter is only registered when the 'dev'
 *                            profile is active (static profiles = ['dev']).
 *
 *   5. Constructor injection — NotificationService receives its dependency
 *                            via a static constructorArgs declaration rather
 *                            than null-property autowiring.
 *
 *   6. setApplicationContext — AuditService receives the ApplicationContext
 *                            for dynamic bean lookup at runtime.
 */
import { BeanPostProcessor, createProxy, ApplicationEvent } from '@alt-javascript/cdi';

// ─── Application Events ───────────────────────────────────────────────────────

/**
 * OrderPlacedEvent — published by OrderService when an order is created.
 * Any bean with onApplicationEvent() receives it automatically.
 */
export class OrderPlacedEvent extends ApplicationEvent {
  constructor(orderId, amount) {
    super('orderService'); // source = the publisher
    this.eventType = 'OrderPlacedEvent';
    this.orderId = orderId;
    this.amount = amount;
  }
}

// ─── BeanPostProcessor + AOP ──────────────────────────────────────────────────

/**
 * TimingBeanPostProcessor — wraps service beans with an AOP timing proxy.
 *
 * Activated when audit.enabled = true in config.
 * Extends BeanPostProcessor — CDI detects it automatically.
 *
 * postProcessAfterInitialization() replaces the bean instance with a Proxy
 * that logs execution time for every public method call.
 */
export class TimingBeanPostProcessor extends BeanPostProcessor {
  static qualifier = '@alt-javascript/example-5-1-advanced/TimingBeanPostProcessor';

  constructor() {
    super();
    this.logger = null; // autowired
    this.config = null; // autowired
  }

  postProcessAfterInitialization(instance, name) {
    // Only wrap service beans — not infrastructure beans
    const skip = ['loggerFactory', 'config', 'applicationEventPublisher', 'timingBeanPostProcessor', 'loggerCategoryCache'];
    if (skip.includes(name)) return instance;

    const auditEnabled = this.config?.has?.('audit.enabled')
      && this.config.get('audit.enabled');
    if (!auditEnabled) return instance;

    // Wrap with AOP around-advice that measures execution time
    return createProxy(instance, [{
      pointcut: /^[a-z]/, // intercept all camelCase public methods
      around: (proceed, args, methodName) => {
        const start = Date.now();
        const result = proceed();
        // Handle both sync and async methods
        if (result && typeof result.then === 'function') {
          return result.then((value) => {
            const ms = Date.now() - start;
            this.logger.info(`[AOP] ${name}.${methodName}() took ${ms}ms`);
            return value;
          });
        }
        const ms = Date.now() - start;
        this.logger.info(`[AOP] ${name}.${methodName}() took ${ms}ms`);
        return result;
      },
    }]);
  }
}

// ─── Conditional Bean ─────────────────────────────────────────────────────────

/**
 * DevOnlyGreeter — only active when NODE_ACTIVE_PROFILES includes 'dev'.
 *
 * Demonstrates profile-conditional bean registration:
 *   static profiles = ['dev']
 *
 * When dev profile is not active, this bean is simply not registered.
 */
export class DevOnlyGreeter {
  static qualifier = '@alt-javascript/example-5-1-advanced/DevOnlyGreeter';
  static profiles = ['dev'];

  constructor() {
    this.logger = null; // autowired
  }

  greet(name) {
    return `[DEV] Hey ${name}! 👋`;
  }
}

// ─── Application Event Listener ───────────────────────────────────────────────

/**
 * AuditService — listens for OrderPlacedEvent via onApplicationEvent().
 *
 * CDI detects any bean with onApplicationEvent() and subscribes it to the
 * ApplicationEventPublisher automatically. No explicit @EventListener annotation.
 *
 * Also demonstrates setApplicationContext() for dynamic bean lookup.
 */
export class AuditService {
  static qualifier = '@alt-javascript/example-5-1-advanced/AuditService';

  constructor() {
    this.logger = null;  // autowired
    this.config = null;  // autowired
    this.appCtx = null;  // set by setApplicationContext()
    this.auditLog = [];  // in-memory audit trail
  }

  setApplicationContext(appCtx) {
    this.appCtx = appCtx;
  }

  init() {
    this.logger.info('AuditService ready — listening for application events');
  }

  /** CDI auto-subscribes this to ApplicationEventPublisher */
  onApplicationEvent(event) {
    if (event.eventType === 'OrderPlacedEvent') {
      const entry = {
        timestamp: new Date().toISOString(),
        event: event.eventType,
        orderId: event.orderId,
        amount: event.amount,
      };
      this.auditLog.push(entry);
      this.logger.info(`[AUDIT] Order placed: id=${event.orderId} amount=${event.amount}`);
    }
  }

  getLog() {
    return [...this.auditLog];
  }
}

// ─── Constructor injection ────────────────────────────────────────────────────

/**
 * NotificationService — receives AuditService via constructor injection.
 *
 * static constructorArgs = ['auditService'] declares the dependency.
 * CDI resolves 'auditService' from the context and passes it to the constructor.
 * No null property needed — the dependency is guaranteed to be set at construction time.
 */
export class NotificationService {
  static qualifier = '@alt-javascript/example-5-1-advanced/NotificationService';
  static constructorArgs = ['auditService']; // constructor injection

  constructor(auditService) {
    this.auditService = auditService; // injected — not null
    this.logger = null;               // autowired (null-property)
    this.notifications = [];
  }

  init() {
    this.logger.info('NotificationService ready (auditService injected via constructor)');
  }

  notify(message) {
    this.notifications.push({ message, time: new Date().toISOString() });
    this.logger.info(`[NOTIFY] ${message}`);
  }

  getNotifications() {
    return [...this.notifications];
  }
}

// ─── Domain service with event publishing ─────────────────────────────────────

/**
 * OrderService — publishes events and demonstrates all features together.
 *
 * - applicationEventPublisher: autowired CDI infrastructure bean
 * - auditService / notificationService: autowired CDI singletons
 * - Publishes OrderPlacedEvent → AuditService receives it via onApplicationEvent
 * - NotificationService receives AuditService via constructor injection (not here — see above)
 */
export class OrderService {
  static qualifier = '@alt-javascript/example-5-1-advanced/OrderService';

  constructor() {
    this.logger = null;                    // autowired
    this.applicationEventPublisher = null; // autowired CDI infrastructure
    this.notificationService = null;       // autowired
    this._nextId = 1;
  }

  placeOrder(amount) {
    const orderId = this._nextId++;
    this.logger.info(`Placing order id=${orderId} amount=${amount}`);

    // Publish event — AuditService.onApplicationEvent() fires synchronously
    this.applicationEventPublisher.publish(
      new OrderPlacedEvent(orderId, amount),
    );

    // Notify via NotificationService (also wired into CDI)
    this.notificationService.notify(`Order #${orderId} placed for $${amount}`);

    return orderId;
  }
}

// ─── Application entry point ──────────────────────────────────────────────────

/**
 * Application — ties everything together.
 *
 * dependsOn ensures AuditService is initialised before Application (since
 * the order of CDI wiring is not always deterministic for peers).
 */
export class Application {
  static qualifier = '@alt-javascript/example-5-1-advanced/Application';
  static dependsOn = ['auditService', 'notificationService'];

  constructor() {
    this.logger = null;               // autowired
    this.config = null;               // autowired
    this.orderService = null;         // autowired
    this.auditService = null;         // autowired
    this.notificationService = null;  // autowired
    this.devOnlyGreeter = null;       // autowired — null when dev profile inactive
    this.appName = '${app.name:Advanced CDI}';
    this.appEnv = '${app.env:default}';
  }

  run() {
    console.log(`\n═══ ${this.appName} (env: ${this.appEnv}) ═══\n`);

    // Conditional bean — only present on dev profile
    if (this.devOnlyGreeter) {
      console.log(this.devOnlyGreeter.greet('Developer'));
    } else {
      console.log('DevOnlyGreeter not active (not on dev profile)');
    }

    // Place orders — triggers event publishing and notification
    const id1 = this.orderService.placeOrder(49.99);
    const id2 = this.orderService.placeOrder(129.00);
    this.logger.info(`Orders placed: ${id1}, ${id2}`);

    // AuditService received events via onApplicationEvent
    const log = this.auditService.getLog();
    console.log(`\nAudit log (${log.length} entries):`);
    log.forEach((e) => console.log(`  ${e.timestamp}  ${e.event} orderId=${e.orderId}`));

    // Notifications sent via NotificationService (constructor-injected AuditService not used here)
    const notifications = this.notificationService.getNotifications();
    console.log(`\nNotifications (${notifications.length}):`);
    notifications.forEach((n) => console.log(`  ${n.message}`));

    console.log('\n═══ Done ═══\n');
  }
}
