/* eslint-disable import/extensions */
import { assert } from 'chai';
import PropertySourceChain from '../PropertySourceChain.js';
import EnvPropertySource from '../EnvPropertySource.js';
import EphemeralConfig from '../EphemeralConfig.js';

describe('PropertySourceChain', () => {
  describe('basic precedence', () => {
    it('returns value from highest priority source', () => {
      const high = new EphemeralConfig({ port: '9090' });
      const low = new EphemeralConfig({ port: '8080', host: 'localhost' });
      const chain = new PropertySourceChain([high, low]);

      assert.equal(chain.get('port'), '9090');
      assert.equal(chain.get('host'), 'localhost');
    });

    it('falls through to lower priority when high does not have key', () => {
      const high = new EphemeralConfig({ a: '1' });
      const low = new EphemeralConfig({ b: '2' });
      const chain = new PropertySourceChain([high, low]);

      assert.equal(chain.get('b'), '2');
    });

    it('has() returns true if any source has the key', () => {
      const high = new EphemeralConfig({});
      const low = new EphemeralConfig({ x: '1' });
      const chain = new PropertySourceChain([high, low]);

      assert.isTrue(chain.has('x'));
      assert.isFalse(chain.has('y'));
    });

    it('get() returns defaultValue when no source has key', () => {
      const chain = new PropertySourceChain([new EphemeralConfig({})]);
      assert.equal(chain.get('missing', 'fallback'), 'fallback');
    });

    it('get() throws when no source has key and no default', () => {
      const chain = new PropertySourceChain([new EphemeralConfig({})]);
      assert.throws(() => chain.get('missing'), /Config path missing returned no value/);
    });
  });

  describe('addSource', () => {
    it('adds source at end by default (lowest priority)', () => {
      const chain = new PropertySourceChain([new EphemeralConfig({ k: 'first' })]);
      chain.addSource(new EphemeralConfig({ k: 'second' }));
      assert.equal(chain.get('k'), 'first');
    });

    it('adds source at specific priority index', () => {
      const chain = new PropertySourceChain([new EphemeralConfig({ k: 'low' })]);
      chain.addSource(new EphemeralConfig({ k: 'high' }), 0);
      assert.equal(chain.get('k'), 'high');
    });
  });

  describe('three sources', () => {
    it('correct layering with three sources', () => {
      const env = new EphemeralConfig({ db: 'env-db' });
      const profile = new EphemeralConfig({ db: 'profile-db', cache: 'redis' });
      const defaults = new EphemeralConfig({ db: 'default-db', cache: 'memory', log: 'info' });
      const chain = new PropertySourceChain([env, profile, defaults]);

      assert.equal(chain.get('db'), 'env-db');
      assert.equal(chain.get('cache'), 'redis');
      assert.equal(chain.get('log'), 'info');
    });
  });
});

describe('EnvPropertySource', () => {
  it('reads env var directly', () => {
    const source = new EnvPropertySource({ MY_VAR: 'hello' });
    assert.isTrue(source.has('MY_VAR'));
    assert.equal(source.get('MY_VAR'), 'hello');
  });

  it('relaxed binding: MY_APP_PORT → my.app.port', () => {
    const source = new EnvPropertySource({ MY_APP_PORT: '8080' });
    assert.isTrue(source.has('my.app.port'));
    assert.equal(source.get('my.app.port'), '8080');
  });

  it('relaxed binding: double underscore → dot', () => {
    const source = new EnvPropertySource({ SPRING__DATASOURCE__URL: 'jdbc:mysql://localhost' });
    assert.isTrue(source.has('spring.datasource.url'));
    assert.equal(source.get('spring.datasource.url'), 'jdbc:mysql://localhost');
  });

  it('original key still accessible', () => {
    const source = new EnvPropertySource({ DB_HOST: 'localhost' });
    assert.isTrue(source.has('DB_HOST'));
    assert.isTrue(source.has('db.host'));
  });

  it('has() returns false for missing key', () => {
    const source = new EnvPropertySource({});
    assert.isFalse(source.has('nope'));
  });

  it('get() returns defaultValue for missing key', () => {
    const source = new EnvPropertySource({});
    assert.equal(source.get('nope', 'default'), 'default');
  });

  it('get() returns undefined for missing key without default', () => {
    const source = new EnvPropertySource({});
    assert.isUndefined(source.get('nope'));
  });
});
