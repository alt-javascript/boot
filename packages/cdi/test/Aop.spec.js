/* eslint-disable import/extensions */
import { assert } from 'chai';
import { LoggerFactory } from '@alt-javascript/logger';
import { config } from '@alt-javascript/config';
import {
  ApplicationContext,
  BeanPostProcessor,
  createProxy,
  matchMethod,
} from '../index.js';
import { Context, Singleton } from '../context/index.js';

const logger = LoggerFactory.getLogger('@alt-javascript/cdi/test/Aop_spec');

before(async () => {
  logger.verbose('spec setup started');
});

describe('AOP Specification', () => {
  describe('matchMethod', () => {
    it('matches exact name', () => {
      assert.isTrue(matchMethod('getName', 'getName'));
      assert.isFalse(matchMethod('getName', 'setName'));
    });

    it('matches wildcard', () => {
      assert.isTrue(matchMethod('getName', 'get*'));
      assert.isTrue(matchMethod('getAge', 'get*'));
      assert.isFalse(matchMethod('setName', 'get*'));
    });

    it('matches regex', () => {
      assert.isTrue(matchMethod('getName', /^get/));
      assert.isFalse(matchMethod('setName', /^get/));
    });

    it('matches predicate function', () => {
      assert.isTrue(matchMethod('doSomething', (name) => name.startsWith('do')));
    });
  });

  describe('createProxy', () => {
    it('before advice is called before method', () => {
      const calls = [];
      const target = {
        greet(name) { calls.push(`greet:${name}`); return `hello ${name}`; },
      };
      const proxy = createProxy(target, [
        { pointcut: 'greet', before: (args) => calls.push(`before:${args[0]}`) },
      ]);
      const result = proxy.greet('world');
      assert.equal(result, 'hello world');
      assert.deepEqual(calls, ['before:world', 'greet:world']);
    });

    it('afterReturning receives return value', () => {
      let captured = null;
      const target = { add(a, b) { return a + b; } };
      const proxy = createProxy(target, [
        { pointcut: 'add', afterReturning: (result) => { captured = result; } },
      ]);
      proxy.add(2, 3);
      assert.equal(captured, 5);
    });

    it('afterThrowing catches errors', () => {
      let captured = null;
      const target = { fail() { throw new Error('boom'); } };
      const proxy = createProxy(target, [
        { pointcut: 'fail', afterThrowing: (err) => { captured = err.message; } },
      ]);
      assert.throws(() => proxy.fail(), 'boom');
      assert.equal(captured, 'boom');
    });

    it('around advice wraps method call', () => {
      const target = { compute(x) { return x * 2; } };
      const proxy = createProxy(target, [
        {
          pointcut: 'compute',
          around: (proceed, args) => {
            const result = proceed();
            return result + 1; // modify return
          },
        },
      ]);
      assert.equal(proxy.compute(5), 11); // 5*2 + 1
    });

    it('non-matching methods pass through unchanged', () => {
      const target = { foo() { return 'foo'; }, bar() { return 'bar'; } };
      const proxy = createProxy(target, [
        { pointcut: 'foo', before: () => {} },
      ]);
      assert.equal(proxy.bar(), 'bar');
    });

    it('returns target unchanged when no aspects', () => {
      const target = { x: 1 };
      assert.strictEqual(createProxy(target, []), target);
    });
  });

  describe('AOP via BeanPostProcessor', () => {
    class MyService {
      greet(name) { return `hello ${name}`; }
    }

    class LoggingAopProcessor extends BeanPostProcessor {
      constructor() {
        super();
        this.log = [];
      }

      postProcessAfterInitialization(instance, name) {
        if (name === 'myService') {
          return createProxy(instance, [
            {
              pointcut: 'greet',
              before: (args, methodName) => {
                this.log.push(`before:${methodName}:${args[0]}`);
              },
            },
          ]);
        }
        return instance;
      }
    }

    it('BeanPostProcessor applies AOP proxy to bean', async () => {
      const aopProcessor = new LoggingAopProcessor();
      const context = new Context([
        new Singleton(MyService),
        { Reference: aopProcessor, name: 'loggingAopProcessor' },
      ]);
      const appCtx = new ApplicationContext({ contexts: [context], config });
      await appCtx.start({ run: false });

      const svc = appCtx.get('myService');
      const result = svc.greet('world');
      assert.equal(result, 'hello world');
      assert.deepEqual(aopProcessor.log, ['before:greet:world']);
    });

    it('proxied bean is stored as the context instance', async () => {
      const aopProcessor = new LoggingAopProcessor();
      const context = new Context([
        new Singleton(MyService),
        { Reference: aopProcessor, name: 'loggingAopProcessor' },
      ]);
      const appCtx = new ApplicationContext({ contexts: [context], config });
      await appCtx.start({ run: false });

      // Get it twice — should be the same proxied instance
      const svc1 = appCtx.get('myService');
      const svc2 = appCtx.get('myService');
      assert.strictEqual(svc1, svc2);
    });
  });
});
