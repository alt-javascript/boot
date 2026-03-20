import { assert } from 'chai';
import BrowserProfileResolver from '../BrowserProfileResolver.js';
import ProfileAwareConfig from '../ProfileAwareConfig.js';

describe('BrowserProfileResolver', () => {
  const urlMappings = {
    'localhost:8080': 'dev',
    'localhost:3000': 'dev',
    'staging.example.com': 'staging',
    '*.example.com': 'prod',
    'admin.internal.io': 'dev,staging',
  };

  describe('exact host:port match', () => {
    it('matches localhost:8080 → dev', () => {
      const profiles = BrowserProfileResolver.resolve({
        urlMappings,
        locationHref: 'http://localhost:8080/app',
      });
      assert.deepEqual(profiles, ['dev']);
    });

    it('matches localhost:3000 → dev', () => {
      const profiles = BrowserProfileResolver.resolve({
        urlMappings,
        locationHref: 'http://localhost:3000/',
      });
      assert.deepEqual(profiles, ['dev']);
    });
  });

  describe('exact hostname match', () => {
    it('matches staging.example.com → staging', () => {
      const profiles = BrowserProfileResolver.resolve({
        urlMappings,
        locationHref: 'https://staging.example.com/api',
      });
      assert.deepEqual(profiles, ['staging']);
    });
  });

  describe('wildcard match', () => {
    it('*.example.com matches app.example.com → prod', () => {
      const profiles = BrowserProfileResolver.resolve({
        urlMappings,
        locationHref: 'https://app.example.com/',
      });
      assert.deepEqual(profiles, ['prod']);
    });

    it('*.example.com does not match example.com itself', () => {
      const profiles = BrowserProfileResolver.resolve({
        urlMappings,
        locationHref: 'https://example.com/',
      });
      assert.deepEqual(profiles, ['default']);
    });

    it('exact match takes priority over wildcard', () => {
      const profiles = BrowserProfileResolver.resolve({
        urlMappings,
        locationHref: 'https://staging.example.com/',
      });
      assert.deepEqual(profiles, ['staging']);
    });
  });

  describe('query parameter override', () => {
    it('?profile=test overrides URL mapping', () => {
      const profiles = BrowserProfileResolver.resolve({
        urlMappings,
        locationHref: 'http://localhost:8080/?profile=test',
      });
      assert.deepEqual(profiles, ['test']);
    });

    it('?profile=a,b returns multiple profiles', () => {
      const profiles = BrowserProfileResolver.resolve({
        urlMappings,
        locationHref: 'http://localhost:8080/?profile=a,b',
      });
      assert.deepEqual(profiles, ['a', 'b']);
    });
  });

  describe('comma-separated profile values in mapping', () => {
    it('mapping value "dev,staging" returns both profiles', () => {
      const profiles = BrowserProfileResolver.resolve({
        urlMappings,
        locationHref: 'https://admin.internal.io/',
      });
      assert.deepEqual(profiles, ['dev', 'staging']);
    });
  });

  describe('defaults', () => {
    it('returns ["default"] when no URL matches', () => {
      const profiles = BrowserProfileResolver.resolve({
        urlMappings,
        locationHref: 'https://unknown.io/',
      });
      assert.deepEqual(profiles, ['default']);
    });

    it('returns ["default"] with empty mappings', () => {
      const profiles = BrowserProfileResolver.resolve({
        urlMappings: {},
        locationHref: 'http://localhost:8080/',
      });
      assert.deepEqual(profiles, ['default']);
    });

    it('returns ["default"] with no options', () => {
      const profiles = BrowserProfileResolver.resolve({});
      assert.deepEqual(profiles, ['default']);
    });
  });
});

describe('ProfileAwareConfig', () => {
  const configObject = {
    api: { url: 'http://prod.example.com' },
    logging: { level: { '/': 'warn' } },
    app: { name: 'MyApp' },
    profiles: {
      urls: {
        'localhost:8080': 'dev',
        '*.example.com': 'prod',
      },
      dev: {
        api: { url: 'http://localhost:8081' },
        logging: { level: { '/': 'debug' } },
      },
      staging: {
        api: { url: 'http://staging.example.com' },
      },
    },
  };

  describe('profile overlay', () => {
    it('dev profile overrides api.url', () => {
      const config = new ProfileAwareConfig(configObject, ['dev']);
      assert.equal(config.get('api.url'), 'http://localhost:8081');
    });

    it('dev profile overrides logging level', () => {
      const config = new ProfileAwareConfig(configObject, ['dev']);
      assert.equal(config.get('logging.level./'), 'debug');
    });

    it('non-overridden values fall through to base config', () => {
      const config = new ProfileAwareConfig(configObject, ['dev']);
      assert.equal(config.get('app.name'), 'MyApp');
    });

    it('staging profile overrides api.url only', () => {
      const config = new ProfileAwareConfig(configObject, ['staging']);
      assert.equal(config.get('api.url'), 'http://staging.example.com');
      assert.equal(config.get('logging.level./'), 'warn');
    });
  });

  describe('default profile', () => {
    it('uses base config when profile is "default"', () => {
      const config = new ProfileAwareConfig(configObject, ['default']);
      assert.equal(config.get('api.url'), 'http://prod.example.com');
    });

    it('uses base config when no profiles active', () => {
      const config = new ProfileAwareConfig(configObject, []);
      assert.equal(config.get('api.url'), 'http://prod.example.com');
    });
  });

  describe('has()', () => {
    it('returns true for profile-overridden paths', () => {
      const config = new ProfileAwareConfig(configObject, ['dev']);
      assert.isTrue(config.has('api.url'));
    });

    it('returns true for base config paths', () => {
      const config = new ProfileAwareConfig(configObject, ['dev']);
      assert.isTrue(config.has('app.name'));
    });

    it('returns false for non-existent paths', () => {
      const config = new ProfileAwareConfig(configObject, ['dev']);
      assert.isFalse(config.has('nonexistent.key'));
    });

    it('profiles section is stripped from base config', () => {
      const config = new ProfileAwareConfig(configObject, ['dev']);
      assert.isFalse(config.has('profiles.urls'));
    });
  });

  describe('activeProfiles', () => {
    it('returns the active profile names', () => {
      const config = new ProfileAwareConfig(configObject, ['dev']);
      assert.deepEqual(config.activeProfiles, ['dev']);
    });

    it('returns multiple profiles', () => {
      const config = new ProfileAwareConfig(configObject, ['dev', 'staging']);
      assert.deepEqual(config.activeProfiles, ['dev', 'staging']);
    });
  });

  describe('multiple profiles', () => {
    it('later profile overrides earlier for same key', () => {
      // dev sets api.url to localhost:8081, staging sets it to staging.example.com
      // With ['dev', 'staging'], dev is checked first (wins)
      const config = new ProfileAwareConfig(configObject, ['dev', 'staging']);
      assert.equal(config.get('api.url'), 'http://localhost:8081');
    });

    it('earlier profile provides values not in later', () => {
      // staging doesn't override logging, dev does
      const config = new ProfileAwareConfig(configObject, ['dev', 'staging']);
      assert.equal(config.get('logging.level./'), 'debug');
    });
  });

  describe('defaultValue fallback', () => {
    it('returns defaultValue when path not found anywhere', () => {
      const config = new ProfileAwareConfig(configObject, ['dev']);
      assert.equal(config.get('missing.key', 'fallback'), 'fallback');
    });
  });

  describe('end-to-end: resolver + config', () => {
    it('resolves profiles from URL and applies config overlays', () => {
      const profiles = BrowserProfileResolver.resolve({
        urlMappings: configObject.profiles.urls,
        locationHref: 'http://localhost:8080/app',
      });
      const config = new ProfileAwareConfig(configObject, profiles);

      assert.deepEqual(profiles, ['dev']);
      assert.equal(config.get('api.url'), 'http://localhost:8081');
      assert.equal(config.get('logging.level./'), 'debug');
      assert.equal(config.get('app.name'), 'MyApp');
    });

    it('prod URL gets base config (no prod profile section defined)', () => {
      const profiles = BrowserProfileResolver.resolve({
        urlMappings: configObject.profiles.urls,
        locationHref: 'https://app.example.com/',
      });
      const config = new ProfileAwareConfig(configObject, profiles);

      assert.deepEqual(profiles, ['prod']);
      assert.equal(config.get('api.url'), 'http://prod.example.com');
    });
  });
});
