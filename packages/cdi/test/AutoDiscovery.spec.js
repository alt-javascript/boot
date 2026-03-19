/* eslint-disable import/extensions */
import { assert } from 'chai';
import { LoggerFactory } from '@alt-javascript/logger';
import { config } from '@alt-javascript/config';
import {
  ApplicationContext,
  scan,
  discover,
  ComponentRegistry,
  COMPONENT_META_KEY,
  defaultRegistry,
} from '../index.js';
import { Context, Singleton } from '../context/index.js';

const logger = LoggerFactory.getLogger('@alt-javascript/cdi/test/AutoDiscovery_spec');

class AnnotatedService {
  static __component = true;

  constructor() {
    this.name = 'annotated';
  }
}

class AnnotatedPrototype {
  static __component = { scope: 'prototype' };

  constructor() {
    this.name = 'proto';
  }
}

class AnnotatedWithOptions {
  static __component = { scope: 'singleton', profiles: 'test' };

  constructor() {
    this.name = 'opts';
  }
}

class PlainClass {
  constructor() {
    this.name = 'plain';
  }
}

before(async () => {
  logger.verbose('spec setup started');
});

afterEach(() => {
  defaultRegistry.clear();
});

describe('Auto-Discovery Specification', () => {
  describe('scan()', () => {
    it('detects classes with static __component = true', () => {
      const defs = scan([AnnotatedService]);
      assert.equal(defs.length, 1);
      assert.equal(defs[0].name, 'annotatedService');
      assert.equal(defs[0].scope, 'singleton');
      assert.equal(defs[0].Reference, AnnotatedService);
    });

    it('reads scope from __component object', () => {
      const defs = scan([AnnotatedPrototype]);
      assert.equal(defs.length, 1);
      assert.equal(defs[0].scope, 'prototype');
    });

    it('reads profiles from __component object', () => {
      const defs = scan([AnnotatedWithOptions]);
      assert.equal(defs.length, 1);
      assert.equal(defs[0].profiles, 'test');
    });

    it('ignores classes without __component', () => {
      const defs = scan([PlainClass]);
      assert.equal(defs.length, 0);
    });

    it('ignores null/undefined entries', () => {
      const defs = scan([null, undefined, AnnotatedService]);
      assert.equal(defs.length, 1);
    });

    it('handles mixed annotated and plain classes', () => {
      const defs = scan([AnnotatedService, PlainClass, AnnotatedPrototype]);
      assert.equal(defs.length, 2);
    });

    it('supports __component as string (shorthand for scope)', () => {
      class ShorthandClass {
        static __component = 'prototype';
      }
      const defs = scan([ShorthandClass]);
      assert.equal(defs.length, 1);
      assert.equal(defs[0].scope, 'prototype');
    });
  });

  describe('ComponentRegistry', () => {
    it('register and drain cycle', () => {
      const reg = new ComponentRegistry();
      reg.register(AnnotatedService, { name: 'svc' });
      assert.equal(reg.size, 1);

      const defs = reg.drain();
      assert.equal(defs.length, 1);
      assert.equal(defs[0].name, 'svc');
      assert.equal(reg.size, 0, 'registry should be empty after drain');
    });

    it('derives name from class if not provided', () => {
      const reg = new ComponentRegistry();
      reg.register(AnnotatedService);
      const defs = reg.drain();
      assert.equal(defs[0].name, 'annotatedService');
    });

    it('throws if name cannot be determined', () => {
      const reg = new ComponentRegistry();
      assert.throws(() => reg.register({}, {}), 'name is required');
    });
  });

  describe('discover()', () => {
    it('merges scan results with default registry', () => {
      defaultRegistry.register(PlainClass, { name: 'registeredPlain' });
      const defs = discover([AnnotatedService]);
      assert.equal(defs.length, 2);
      const names = defs.map((d) => d.name);
      assert.include(names, 'annotatedService');
      assert.include(names, 'registeredPlain');
    });

    it('works with no classes (registry only)', () => {
      defaultRegistry.register(PlainClass, { name: 'registeredPlain' });
      const defs = discover();
      assert.equal(defs.length, 1);
    });
  });

  describe('ApplicationContext integration', () => {
    it('scanned components work through full context lifecycle', async () => {
      const defs = scan([AnnotatedService]);
      const context = new Context(defs);
      const appCtx = new ApplicationContext({ contexts: [context], config });
      await appCtx.start({ run: false });

      const svc = appCtx.get('annotatedService');
      assert.exists(svc);
      assert.equal(svc.name, 'annotated');
    });

    it('scanned prototypes create new instances', async () => {
      const defs = scan([AnnotatedPrototype]);
      const context = new Context(defs);
      const appCtx = new ApplicationContext({ contexts: [context], config });
      await appCtx.start({ run: false });

      const p1 = appCtx.get('annotatedPrototype');
      const p2 = appCtx.get('annotatedPrototype');
      assert.notStrictEqual(p1, p2, 'prototypes should be different instances');
    });
  });
});
