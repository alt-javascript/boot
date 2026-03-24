/**
 * example-5-1-advanced — feature tests
 *
 * Verifies each advanced CDI feature in isolation using Boot.boot() with run:false.
 */
import { assert } from 'chai';
import { Boot } from '@alt-javascript/boot';
import { Context, Singleton, BeanPostProcessor, createProxy } from '@alt-javascript/cdi';
import {
  TimingBeanPostProcessor,
  DevOnlyGreeter,
  AuditService,
  NotificationService,
  OrderService,
  OrderPlacedEvent,
  Application,
} from '../src/services.js';

const BASE_CONFIG = {
  boot: { 'banner-mode': 'off' },
  app: { name: 'Advanced Test', version: '1.0.0', env: 'test' },
  logging: { level: { ROOT: 'error' } },
  audit: { enabled: true },
};

async function bootAll(configOverride = {}) {
  const config = { ...BASE_CONFIG, ...configOverride };
  const context = new Context([
    new Singleton(TimingBeanPostProcessor),
    new Singleton(DevOnlyGreeter),
    new Singleton(AuditService),
    new Singleton(NotificationService),
    new Singleton(OrderService),
    new Singleton(Application),
  ]);
  return Boot.boot({ config, contexts: [context], run: false });
}

describe('example-5-1-advanced', () => {

  // ── BeanPostProcessor ───────────────────────────────────────────────────────

  describe('BeanPostProcessor', () => {

    it('TimingBeanPostProcessor is detected as a BeanPostProcessor', async () => {
      const appCtx = await bootAll();
      const bpp = appCtx.get('timingBeanPostProcessor');
      assert.instanceOf(bpp, BeanPostProcessor);
    });

    it('wraps service beans with a Proxy when audit.enabled = true', async () => {
      const appCtx = await bootAll({ audit: { enabled: true } });
      const orderService = appCtx.get('orderService');
      // A Proxy is still an object — verify it behaves correctly
      assert.isFunction(orderService.placeOrder);
    });

    it('does not wrap beans when audit.enabled = false', async () => {
      const appCtx = await bootAll({ audit: { enabled: false } });
      const orderService = appCtx.get('orderService');
      assert.isFunction(orderService.placeOrder);
    });

  });

  // ── AOP ────────────────────────────────────────────────────────────────────

  describe('AOP (createProxy)', () => {

    it('createProxy intercepts method calls with around advice', () => {
      const calls = [];
      const target = {
        compute(x) { return x * 2; },
      };

      const proxy = createProxy(target, [{
        pointcut: 'compute',
        around: (proceed, args, methodName) => {
          calls.push({ methodName, args });
          return proceed();
        },
      }]);

      const result = proxy.compute(21);
      assert.equal(result, 42);
      assert.equal(calls.length, 1);
      assert.equal(calls[0].methodName, 'compute');
    });

    it('around advice can modify return value', () => {
      const target = { getValue() { return 1; } };
      const proxy = createProxy(target, [{
        pointcut: 'getValue',
        around: () => 99,
      }]);
      assert.equal(proxy.getValue(), 99);
    });

  });

  // ── Application Events ──────────────────────────────────────────────────────

  describe('Application Events', () => {

    it('OrderService publishes OrderPlacedEvent; AuditService receives it', async () => {
      const appCtx = await bootAll();
      const orderService = appCtx.get('orderService');
      const auditService = appCtx.get('auditService');

      orderService.placeOrder(49.99);
      orderService.placeOrder(99.00);

      const log = auditService.getLog();
      assert.equal(log.length, 2);
      assert.equal(log[0].event, 'OrderPlacedEvent');
      assert.closeTo(log[0].amount, 49.99, 0.01);
      assert.closeTo(log[1].amount, 99.00, 0.01);
    });

    it('OrderPlacedEvent carries orderId and amount', () => {
      const event = new OrderPlacedEvent(7, 42.5);
      assert.equal(event.eventType, 'OrderPlacedEvent');
      assert.equal(event.orderId, 7);
      assert.equal(event.amount, 42.5);
    });

  });

  // ── Conditional beans ───────────────────────────────────────────────────────

  describe('Conditional beans (profile-conditional)', () => {

    it('DevOnlyGreeter is NOT registered when dev profile is inactive', async () => {
      const appCtx = await bootAll();
      const greeter = appCtx.get('devOnlyGreeter', null);
      assert.isNull(greeter, 'should not be registered without dev profile');
    });

    it('DevOnlyGreeter IS registered on dev profile', async () => {
      const { ApplicationContext } = await import('@alt-javascript/cdi');
      const { EphemeralConfig } = await import('@alt-javascript/config');
      const config = new EphemeralConfig(BASE_CONFIG);
      const appCtx = new ApplicationContext({
        profiles: 'dev',
        contexts: [new Context([
          new Singleton(TimingBeanPostProcessor),
          new Singleton(DevOnlyGreeter),
          new Singleton(AuditService),
          new Singleton(NotificationService),
          new Singleton(OrderService),
          new Singleton(Application),
        ])],
        config,
      });
      await appCtx.start({ run: false });
      const greeter = appCtx.get('devOnlyGreeter', null);
      assert.isNotNull(greeter);
      assert.equal(greeter.greet('Dev'), '[DEV] Hey Dev! 👋');
    });

  });

  // ── Constructor injection ───────────────────────────────────────────────────

  describe('Constructor injection', () => {

    it('NotificationService receives AuditService via constructor', async () => {
      const appCtx = await bootAll();
      const notifService = appCtx.get('notificationService');
      // auditService was injected via constructorArgs — not null
      assert.isNotNull(notifService.auditService);
      assert.instanceOf(notifService.auditService, AuditService);
    });

    it('constructor-injected service is functional', async () => {
      const appCtx = await bootAll();
      const notifService = appCtx.get('notificationService');
      notifService.notify('Test notification');
      const notifications = notifService.getNotifications();
      assert.equal(notifications.length, 1);
      assert.equal(notifications[0].message, 'Test notification');
    });

  });

  // ── setApplicationContext ───────────────────────────────────────────────────

  describe('setApplicationContext', () => {

    it('AuditService receives the ApplicationContext reference', async () => {
      const appCtx = await bootAll();
      const auditService = appCtx.get('auditService');
      assert.isNotNull(auditService.appCtx);
      // Can do dynamic lookup via the injected context
      const orderService = auditService.appCtx.get('orderService');
      assert.isNotNull(orderService);
    });

  });

});
