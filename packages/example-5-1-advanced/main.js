/**
 * example-5-1-advanced — entry point
 *
 * Advanced CDI features in one runnable application:
 *
 *   BeanPostProcessor  — TimingBeanPostProcessor wraps all service beans with
 *                        AOP timing advice when audit.enabled = true in config.
 *
 *   AOP (createProxy)  — around-advice measures and logs method execution time.
 *
 *   Application Events — OrderService publishes OrderPlacedEvent;
 *                        AuditService listens via onApplicationEvent().
 *
 *   Conditional beans  — DevOnlyGreeter registered only on 'dev' profile
 *                        (static profiles = ['dev']).
 *
 *   Constructor injection — NotificationService receives AuditService via
 *                           static constructorArgs = ['auditService'].
 *
 *   setApplicationContext — AuditService gets a reference to the ApplicationContext
 *                           for dynamic bean lookup.
 *
 * Run:
 *   npm start          # env=default, no DevOnlyGreeter
 *   npm run start:dev  # env=development, DevOnlyGreeter active
 */
import { Boot } from '@alt-javascript/boot';
import { Context, Singleton } from '@alt-javascript/cdi';
import {
  TimingBeanPostProcessor,
  DevOnlyGreeter,
  AuditService,
  NotificationService,
  OrderService,
  Application,
} from './src/services.js';

const context = new Context([
  new Singleton(TimingBeanPostProcessor), // BeanPostProcessor — detected automatically
  new Singleton(DevOnlyGreeter),          // conditional: dev profile only
  new Singleton(AuditService),            // event listener + setApplicationContext
  new Singleton(NotificationService),     // constructor injection from AuditService
  new Singleton(OrderService),            // publishes events
  new Singleton(Application),             // entry point — run() called by CDI
]);

await Boot.boot({ contexts: [context] });
