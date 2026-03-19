/* eslint-disable import/extensions */
import { assert } from 'chai';
import { LoggerFactory } from '@alt-javascript/logger';
import { EphemeralConfig } from '@alt-javascript/config';
import {
  ApplicationContext,
  conditionalOnProperty,
  conditionalOnMissingBean,
  conditionalOnBean,
  conditionalOnClass,
  conditionalOnProfile,
  allOf,
  anyOf,
  evaluateConditions,
} from '../index.js';
import { Context, Singleton } from '../context/index.js';

const logger = LoggerFactory.getLogger('@alt-javascript/cdi/test/Conditions_spec');

class ServiceA {
  constructor() { this.name = 'a'; }
}

class ServiceB {
  constructor() { this.name = 'b'; }
}

class DefaultImpl {
  constructor() { this.type = 'default'; }
}

class CustomImpl {
  constructor() { this.type = 'custom'; }
}

before(async () => {
  logger.verbose('spec setup started');
});

describe('Conditions Specification', () => {
  describe('conditionalOnProperty', () => {
    it('passes when property exists and matches value', () => {
      const cfg = new EphemeralConfig({ feature: { enabled: true } });
      const cond = conditionalOnProperty('feature.enabled', true);
      assert.isTrue(cond(cfg, {}));
    });

    it('fails when property has wrong value', () => {
      const cfg = new EphemeralConfig({ feature: { enabled: false } });
      const cond = conditionalOnProperty('feature.enabled', true);
      assert.isFalse(cond(cfg, {}));
    });

    it('passes when just checking existence (no expectedValue)', () => {
      const cfg = new EphemeralConfig({ feature: { enabled: false } });
      const cond = conditionalOnProperty('feature.enabled');
      assert.isTrue(cond(cfg, {}));
    });

    it('fails when property missing and matchIfMissing is false', () => {
      const cfg = new EphemeralConfig({});
      const cond = conditionalOnProperty('feature.enabled', true, false);
      assert.isFalse(cond(cfg, {}));
    });

    it('passes when property missing and matchIfMissing is true', () => {
      const cfg = new EphemeralConfig({});
      const cond = conditionalOnProperty('feature.enabled', true, true);
      assert.isTrue(cond(cfg, {}));
    });
  });

  describe('conditionalOnMissingBean', () => {
    it('passes when bean does not exist', () => {
      const cond = conditionalOnMissingBean('myBean');
      assert.isTrue(cond({}, {}));
    });

    it('fails when bean already exists', () => {
      const cond = conditionalOnMissingBean('myBean');
      assert.isFalse(cond({}, { myBean: {} }));
    });
  });

  describe('conditionalOnBean', () => {
    it('passes when bean exists', () => {
      const cond = conditionalOnBean('myBean');
      assert.isTrue(cond({}, { myBean: {} }));
    });

    it('fails when bean does not exist', () => {
      const cond = conditionalOnBean('myBean');
      assert.isFalse(cond({}, {}));
    });
  });

  describe('conditionalOnClass', () => {
    it('passes when given a class reference', () => {
      const cond = conditionalOnClass(ServiceA);
      assert.isTrue(cond());
    });

    it('fails when global name not found', () => {
      const cond = conditionalOnClass('NonExistentGlobalClass12345');
      assert.isFalse(cond());
    });
  });

  describe('allOf / anyOf', () => {
    it('allOf requires all conditions to pass', () => {
      const passing = () => true;
      const failing = () => false;
      assert.isTrue(allOf(passing, passing)({}, {}));
      assert.isFalse(allOf(passing, failing)({}, {}));
    });

    it('anyOf requires at least one condition to pass', () => {
      const passing = () => true;
      const failing = () => false;
      assert.isTrue(anyOf(failing, passing)({}, {}));
      assert.isFalse(anyOf(failing, failing)({}, {}));
    });
  });

  describe('evaluateConditions', () => {
    it('filters out components whose conditions fail', () => {
      const cfg = new EphemeralConfig({ feature: { x: true } });
      const defs = [
        { name: 'a', condition: conditionalOnProperty('feature.x', true) },
        { name: 'b', condition: conditionalOnProperty('feature.y', true) },
        { name: 'c' }, // no condition, always passes
      ];
      const result = evaluateConditions(defs, cfg);
      assert.equal(result.length, 2);
      const names = result.map((d) => d.name);
      assert.include(names, 'a');
      assert.include(names, 'c');
    });
  });

  describe('ApplicationContext integration', () => {
    it('conditional component is registered when condition passes', async () => {
      const cfg = new EphemeralConfig({ feature: { x: true } });
      const context = new Context([
        {
          Reference: ServiceA,
          name: 'serviceA',
          condition: conditionalOnProperty('feature.x', true),
        },
      ]);
      const appCtx = new ApplicationContext({ contexts: [context], config: cfg });
      await appCtx.start({ run: false });

      const svc = appCtx.get('serviceA');
      assert.exists(svc);
      assert.equal(svc.name, 'a');
    });

    it('conditional component is skipped when condition fails', async () => {
      const cfg = new EphemeralConfig({ feature: { x: false } });
      const context = new Context([
        {
          Reference: ServiceA,
          name: 'serviceA',
          condition: conditionalOnProperty('feature.x', true),
        },
      ]);
      const appCtx = new ApplicationContext({ contexts: [context], config: cfg });
      await appCtx.start({ run: false });

      const svc = appCtx.get('serviceA', null);
      assert.isNull(svc, 'serviceA should not be registered');
    });

    it('conditionalOnMissingBean provides default implementation', async () => {
      const cfg = new EphemeralConfig({});
      const context = new Context([
        {
          Reference: DefaultImpl,
          name: 'myService',
          condition: conditionalOnMissingBean('myService'),
        },
      ]);
      const appCtx = new ApplicationContext({ contexts: [context], config: cfg });
      await appCtx.start({ run: false });

      const svc = appCtx.get('myService');
      assert.equal(svc.type, 'default');
    });

    it('conditionalOnMissingBean skips when bean exists from earlier registration', async () => {
      const cfg = new EphemeralConfig({});
      const context = new Context([
        { Reference: CustomImpl, name: 'myService' },
      ]);
      const context2 = new Context([
        {
          Reference: DefaultImpl,
          name: 'myService',
          condition: conditionalOnMissingBean('myService'),
        },
      ]);
      const appCtx = new ApplicationContext({ contexts: [context, context2], config: cfg });
      await appCtx.start({ run: false });

      const svc = appCtx.get('myService');
      assert.equal(svc.type, 'custom', 'custom should win over conditional default');
    });
  });

  describe('conditionalOnProfile', () => {
    it('passes when profile is active', () => {
      const cond = conditionalOnProfile('production');
      assert.isTrue(cond(null, null, ['production']));
    });

    it('fails when profile is not active', () => {
      const cond = conditionalOnProfile('production');
      assert.isFalse(cond(null, null, ['dev']));
    });

    it('passes when any of multiple profiles is active', () => {
      const cond = conditionalOnProfile('dev', 'staging');
      assert.isTrue(cond(null, null, ['staging']));
    });

    it('fails when none of multiple profiles is active', () => {
      const cond = conditionalOnProfile('dev', 'staging');
      assert.isFalse(cond(null, null, ['production']));
    });

    it('negated profile passes when profile is not active', () => {
      const cond = conditionalOnProfile('!test');
      assert.isTrue(cond(null, null, ['production']));
    });

    it('negated profile fails when profile is active', () => {
      const cond = conditionalOnProfile('!test');
      assert.isFalse(cond(null, null, ['test']));
    });

    it('mixed positive and negated profiles', () => {
      const cond = conditionalOnProfile('production', '!test');
      // production active, test not active → pass
      assert.isTrue(cond(null, null, ['production']));
      // production active, test also active → fail (negation fails)
      assert.isFalse(cond(null, null, ['production', 'test']));
      // neither production nor test active → fail (positive not met)
      assert.isFalse(cond(null, null, ['dev']));
    });

    it('passes with no active profiles when only negations specified', () => {
      const cond = conditionalOnProfile('!test');
      assert.isTrue(cond(null, null, []));
    });

    it('composes with allOf', () => {
      const cond = allOf(
        conditionalOnProfile('production'),
        conditionalOnProperty('feature.enabled', true),
      );
      const cfg = new EphemeralConfig({ feature: { enabled: true } });
      assert.isTrue(cond(cfg, {}, ['production']));
      assert.isFalse(cond(cfg, {}, ['dev']));
    });
  });

  describe('conditionalOnProfile in ApplicationContext', () => {
    it('registers component when profile matches', async () => {
      const cfg = new EphemeralConfig({});
      const context = new Context([
        {
          Reference: ServiceA,
          name: 'serviceA',
          condition: conditionalOnProfile('production'),
        },
      ]);
      const appCtx = new ApplicationContext({ contexts: [context], config: cfg, profiles: 'production' });
      await appCtx.start({ run: false });

      const svc = appCtx.get('serviceA');
      assert.exists(svc);
    });

    it('skips component when profile does not match', async () => {
      const cfg = new EphemeralConfig({});
      const context = new Context([
        {
          Reference: ServiceA,
          name: 'serviceA',
          condition: conditionalOnProfile('production'),
        },
      ]);
      const appCtx = new ApplicationContext({ contexts: [context], config: cfg, profiles: 'dev' });
      await appCtx.start({ run: false });

      const svc = appCtx.get('serviceA', null);
      assert.isNull(svc);
    });

    it('registers component with negated profile when profile is not active', async () => {
      const cfg = new EphemeralConfig({});
      const context = new Context([
        {
          Reference: ServiceA,
          name: 'serviceA',
          condition: conditionalOnProfile('!test'),
        },
      ]);
      const appCtx = new ApplicationContext({ contexts: [context], config: cfg, profiles: 'production' });
      await appCtx.start({ run: false });

      const svc = appCtx.get('serviceA');
      assert.exists(svc);
    });
  });

  describe('NODE_ACTIVE_PROFILES auto-detection', () => {
    let originalEnv;

    beforeEach(() => {
      originalEnv = process.env.NODE_ACTIVE_PROFILES;
    });

    afterEach(() => {
      if (originalEnv === undefined) {
        delete process.env.NODE_ACTIVE_PROFILES;
      } else {
        process.env.NODE_ACTIVE_PROFILES = originalEnv;
      }
    });

    it('reads profiles from NODE_ACTIVE_PROFILES when not passed explicitly', async () => {
      process.env.NODE_ACTIVE_PROFILES = 'production';
      const cfg = new EphemeralConfig({});
      const context = new Context([
        {
          Reference: ServiceA,
          name: 'serviceA',
          profiles: ['production'],
        },
        {
          Reference: ServiceB,
          name: 'serviceB',
          profiles: ['dev'],
        },
      ]);
      const appCtx = new ApplicationContext({ contexts: [context], config: cfg });
      await appCtx.start({ run: false });

      assert.exists(appCtx.get('serviceA'));
      assert.isNull(appCtx.get('serviceB', null));
    });

    it('explicit profiles option overrides NODE_ACTIVE_PROFILES', async () => {
      process.env.NODE_ACTIVE_PROFILES = 'production';
      const cfg = new EphemeralConfig({});
      const context = new Context([
        {
          Reference: ServiceA,
          name: 'serviceA',
          profiles: ['dev'],
        },
      ]);
      const appCtx = new ApplicationContext({ contexts: [context], config: cfg, profiles: 'dev' });
      await appCtx.start({ run: false });

      assert.exists(appCtx.get('serviceA'));
    });

    it('conditionalOnProfile works with NODE_ACTIVE_PROFILES', async () => {
      process.env.NODE_ACTIVE_PROFILES = 'staging';
      const cfg = new EphemeralConfig({});
      const context = new Context([
        {
          Reference: ServiceA,
          name: 'serviceA',
          condition: conditionalOnProfile('staging'),
        },
        {
          Reference: ServiceB,
          name: 'serviceB',
          condition: conditionalOnProfile('production'),
        },
      ]);
      const appCtx = new ApplicationContext({ contexts: [context], config: cfg });
      await appCtx.start({ run: false });

      assert.exists(appCtx.get('serviceA'));
      assert.isNull(appCtx.get('serviceB', null));
    });
  });
});
