/* eslint-disable import/extensions */
import { assert } from 'chai';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import ProfileConfigLoader from '../ProfileConfigLoader.js';

const testDir = join(tmpdir(), `altjs-config-test-${Date.now()}`);

before(() => {
  mkdirSync(testDir, { recursive: true });
  mkdirSync(join(testDir, 'config'), { recursive: true });
});

after(() => {
  rmSync(testDir, { recursive: true, force: true });
});

describe('ProfileConfigLoader', () => {
  describe('JSON loading', () => {
    it('loads application.json from config/', () => {
      writeFileSync(join(testDir, 'config', 'application.json'), JSON.stringify({
        server: { port: 8080, host: 'localhost' },
        app: { name: 'test-app' },
      }));

      const config = ProfileConfigLoader.load({ basePath: testDir, env: {} });

      assert.equal(config.get('server.port'), 8080);
      assert.equal(config.get('server.host'), 'localhost');
      assert.equal(config.get('app.name'), 'test-app');
    });

    it('loads profile-specific JSON', () => {
      writeFileSync(join(testDir, 'config', 'application.json'), JSON.stringify({
        server: { port: 8080 },
        db: { host: 'localhost' },
      }));
      writeFileSync(join(testDir, 'config', 'application-dev.yaml'), JSON.stringify({
        server: { port: 3000 },
      }));

      const config = ProfileConfigLoader.load({
        basePath: testDir,
        profiles: 'dev',
        env: {},
      });

      // Profile overrides default
      assert.equal(config.get('server.port'), 3000);
      // Default still available for non-overridden keys
      assert.equal(config.get('db.host'), 'localhost');
    });
  });

  describe('YAML loading', () => {
    it('loads application.yaml', () => {
      writeFileSync(join(testDir, 'config', 'application.yaml'), [
        'spring:',
        '  datasource:',
        '    url: jdbc:mysql://localhost/mydb',
        '    username: root',
        'server:',
        '  port: 9090',
      ].join('\n'));

      const config = ProfileConfigLoader.load({ basePath: testDir, env: {} });

      assert.equal(config.get('spring.datasource.url'), 'jdbc:mysql://localhost/mydb');
      assert.equal(config.get('server.port'), 9090);
    });

    it('loads profile-specific YAML', () => {
      writeFileSync(join(testDir, 'config', 'application-prod.yaml'), [
        'server:',
        '  port: 443',
        '  ssl: true',
      ].join('\n'));

      const config = ProfileConfigLoader.load({
        basePath: testDir,
        profiles: 'prod',
        env: {},
      });

      assert.equal(config.get('server.port'), 443);
      assert.equal(config.get('server.ssl'), true);
    });
  });

  describe('.properties loading', () => {
    it('loads application.properties', () => {
      writeFileSync(join(testDir, 'config', 'application.properties'), [
        'app.title=My Application',
        'app.version=1.0.0',
        'security.roles[0]=USER',
        'security.roles[1]=ADMIN',
      ].join('\n'));

      const config = ProfileConfigLoader.load({ basePath: testDir, env: {} });

      assert.equal(config.get('app.title'), 'My Application');
      assert.equal(config.get('app.version'), '1.0.0');
    });
  });

  describe('NODE_ACTIVE_PROFILES from env', () => {
    it('reads profiles from NODE_ACTIVE_PROFILES', () => {
      writeFileSync(join(testDir, 'config', 'application.json'), JSON.stringify({
        mode: 'default',
      }));
      writeFileSync(join(testDir, 'config', 'application-staging.json'), JSON.stringify({
        mode: 'staging',
      }));

      const config = ProfileConfigLoader.load({
        basePath: testDir,
        env: { NODE_ACTIVE_PROFILES: 'staging' },
      });

      assert.equal(config.get('mode'), 'staging');
    });

    it('multiple profiles — last profile has highest priority', () => {
      writeFileSync(join(testDir, 'config', 'application-a.json'), JSON.stringify({
        val: 'from-a', onlyA: 'yes',
      }));
      writeFileSync(join(testDir, 'config', 'application-b.json'), JSON.stringify({
        val: 'from-b',
      }));

      const config = ProfileConfigLoader.load({
        basePath: testDir,
        profiles: 'a,b',
        env: {},
      });

      // b is last profile → highest priority for shared keys
      assert.equal(config.get('val'), 'from-b');
      // a's unique keys still accessible
      assert.equal(config.get('onlyA'), 'yes');
    });
  });

  describe('process.env integration', () => {
    it('env vars override file config', () => {
      writeFileSync(join(testDir, 'config', 'application.json'), JSON.stringify({
        server: { port: 8080 },
      }));

      const config = ProfileConfigLoader.load({
        basePath: testDir,
        env: { SERVER_PORT: '9999' },
      });

      // Relaxed binding: SERVER_PORT → server.port
      assert.equal(config.get('server.port'), '9999');
    });

    it('env vars accessible by original name', () => {
      const config = ProfileConfigLoader.load({
        basePath: testDir,
        env: { DATABASE_URL: 'postgres://localhost/db' },
      });

      assert.equal(config.get('DATABASE_URL'), 'postgres://localhost/db');
    });
  });

  describe('programmatic overrides', () => {
    it('overrides beat everything', () => {
      writeFileSync(join(testDir, 'config', 'application.json'), JSON.stringify({
        key: 'from-file',
      }));

      const config = ProfileConfigLoader.load({
        basePath: testDir,
        overrides: { key: 'from-override' },
        env: { KEY: 'from-env' },
      });

      assert.equal(config.get('key'), 'from-override');
    });
  });

  describe('fallback', () => {
    it('fallback used when no other source has the key', () => {
      const config = ProfileConfigLoader.load({
        basePath: testDir,
        fallback: { legacy: 'value' },
        env: {},
      });

      assert.equal(config.get('legacy'), 'value');
    });

    it('fallback with has/get interface works', () => {
      const fallback = {
        has: (p) => p === 'special',
        get: () => 'works',
      };
      const config = ProfileConfigLoader.load({
        basePath: testDir,
        fallback,
        env: {},
      });

      assert.equal(config.get('special'), 'works');
    });
  });

  describe('full precedence integration', () => {
    it('env > profile > default > fallback', () => {
      writeFileSync(join(testDir, 'config', 'application.json'), JSON.stringify({
        a: 'default', b: 'default', c: 'default', d: 'default',
      }));
      writeFileSync(join(testDir, 'config', 'application-test.json'), JSON.stringify({
        a: 'profile', b: 'profile', c: 'profile',
      }));

      const config = ProfileConfigLoader.load({
        basePath: testDir,
        profiles: 'test',
        overrides: { a: 'override' },
        env: { B: 'env' },
        fallback: { e: 'fallback' },
      });

      assert.equal(config.get('a'), 'override');   // programmatic wins
      assert.equal(config.get('b'), 'env');         // env wins over profile
      assert.equal(config.get('c'), 'profile');     // profile wins over default
      assert.equal(config.get('d'), 'default');     // default
      assert.equal(config.get('e'), 'fallback');    // fallback
    });
  });
});
