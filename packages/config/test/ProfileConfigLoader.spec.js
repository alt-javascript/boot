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

  describe('.env file loading', () => {
    it('loads application.env from config/', () => {
      writeFileSync(join(testDir, 'config', 'application.env'), [
        'DATABASE_URL=postgres://localhost:5432/mydb',
        'APP_PORT=5000',
      ].join('\n'));

      const config = ProfileConfigLoader.load({ basePath: testDir, env: {} });

      // Accessible by original key
      assert.equal(config.get('DATABASE_URL'), 'postgres://localhost:5432/mydb');
      // Accessible via relaxed binding
      assert.equal(config.get('app.port'), '5000');
    });

    it('relaxed binding: UPPER_SNAKE → dotted.lower', () => {
      writeFileSync(join(testDir, 'config', 'application.env'), [
        'MY_SERVICE_HOST=localhost',
        'MY_SERVICE_PORT=8080',
      ].join('\n'));

      const config = ProfileConfigLoader.load({ basePath: testDir, env: {} });

      assert.equal(config.get('my.service.host'), 'localhost');
      assert.equal(config.get('my.service.port'), '8080');
    });

    it('process.env beats .env file', () => {
      writeFileSync(join(testDir, 'config', 'application.env'), [
        'SERVER_PORT=4000',
      ].join('\n'));

      const config = ProfileConfigLoader.load({
        basePath: testDir,
        env: { SERVER_PORT: '9999' },
      });

      // Real env var wins
      assert.equal(config.get('server.port'), '9999');
    });

    it('.env file beats application.json', () => {
      writeFileSync(join(testDir, 'config', 'application.json'), JSON.stringify({
        server: { port: 8080 },
      }));
      writeFileSync(join(testDir, 'config', 'application.env'), [
        'SERVER_PORT=7777',
      ].join('\n'));

      const config = ProfileConfigLoader.load({ basePath: testDir, env: {} });

      assert.equal(config.get('server.port'), '7777');
    });

    it('profile .env beats base .env', () => {
      writeFileSync(join(testDir, 'config', 'application.env'), [
        'LOG_LEVEL=info',
      ].join('\n'));
      writeFileSync(join(testDir, 'config', 'application-dev.env'), [
        'LOG_LEVEL=debug',
      ].join('\n'));

      const config = ProfileConfigLoader.load({
        basePath: testDir,
        profiles: 'dev',
        env: {},
      });

      assert.equal(config.get('log.level'), 'debug');
    });

    it('profile .env beats application.json', () => {
      writeFileSync(join(testDir, 'config', 'application.json'), JSON.stringify({
        db: { pool: 5 },
      }));
      writeFileSync(join(testDir, 'config', 'application-prod.env'), [
        'DB_POOL=20',
      ].join('\n'));

      const config = ProfileConfigLoader.load({
        basePath: testDir,
        profiles: 'prod',
        env: {},
      });

      assert.equal(config.get('db.pool'), '20');
    });

    it('base .env leaves process.env keys untouched for other paths', () => {
      writeFileSync(join(testDir, 'config', 'application.env'), [
        'ONLY_IN_DOTENV=yes',
      ].join('\n'));

      const config = ProfileConfigLoader.load({
        basePath: testDir,
        env: { ONLY_IN_PROCESS: 'yes' },
      });

      assert.equal(config.get('ONLY_IN_DOTENV'), 'yes');
      assert.equal(config.get('ONLY_IN_PROCESS'), 'yes');
    });

    it('full 7-layer chain: overrides > process.env > profile.env > base.env > profile.json > base.json > fallback', () => {
      writeFileSync(join(testDir, 'config', 'application.json'), JSON.stringify({
        a: 'base-json', b: 'base-json', c: 'base-json',
        d: 'base-json', e: 'base-json', f: 'base-json',
      }));
      writeFileSync(join(testDir, 'config', 'application-test.json'), JSON.stringify({
        a: 'profile-json', b: 'profile-json', c: 'profile-json',
        d: 'profile-json', e: 'profile-json', f: 'profile-json',
      }));
      writeFileSync(join(testDir, 'config', 'application.env'), [
        'A=base-env',
        'B=base-env',
        'C=base-env',
        'D=base-env',
        'E=base-env',
      ].join('\n'));
      writeFileSync(join(testDir, 'config', 'application-test.env'), [
        'A=profile-env',
        'B=profile-env',
        'C=profile-env',
        'D=profile-env',
      ].join('\n'));

      const config = ProfileConfigLoader.load({
        basePath: testDir,
        profiles: 'test',
        overrides: { a: 'override' },
        env: { B: 'process-env' },
        fallback: { g: 'fallback' },
      });

      assert.equal(config.get('a'), 'override');          // 1. programmatic overrides
      assert.equal(config.get('b'), 'process-env');       // 2. process.env (relaxed: B → b)
      assert.equal(config.get('c'), 'profile-env');       // 3. profile .env (relaxed: C → c)
      assert.equal(config.get('d'), 'profile-env');       // 3. profile .env (relaxed: D → d)
      assert.equal(config.get('e'), 'base-env');          // 4. base .env (relaxed: E → e)
      assert.equal(config.get('f'), 'profile-json');      // 5. profile .json
      assert.equal(config.get('g'), 'fallback');          // 7. fallback
    });
  });
});
