const { assert } = require('chai');
const config = require('config');
const altConfig = require('@alt-javascript/config').config;
const { EphemeralConfig, ConfigFactory, ValueResolvingConfig } = require('@alt-javascript/config');
const { CachingLoggerFactory, LoggerFactory, LoggerCategoryCache } = require('@alt-javascript/logger');
const { boot } = require('..');

const logger = LoggerFactory.getLogger('@alt-javascript/boot/test/boot_spec', config);

before(async () => {
  logger.verbose('before spec setup started');
  // ..
  logger.verbose('before spec setup completed');
});

beforeEach(async () => {
  logger.verbose('before each setup started');
  // ..
  logger.verbose('before each setup completed');
});

after(async () => {
  logger.verbose('after teardown started');
  // ...
  logger.verbose('after teardown completed');
});

beforeEach(async () => {
  logger.verbose('before each setup started');
  // ..
  logger.verbose('before each setup completed');
});

describe('boot function', () => {
  it('boot - config is required', () => {
    assert.throws(() => { boot(); }, 'Unable to detect config, is \'config\' declared or provided?');
  });
  it('boot - config ', () => {
    const ephemeralConfig = new EphemeralConfig({});
    boot({ config: ephemeralConfig });
    assert.instanceOf(global.boot.contexts.root.config, ValueResolvingConfig, 'global.boot.contexts.root.config instanceof ValueResolvingConfig');
    assert.instanceOf(global.boot.contexts.root.loggerFactory, LoggerFactory, 'global.boot.contexts.root.loggerFactory instanceof LoggerFactory');
    assert.instanceOf(global.boot.contexts.root.loggerCategoryCache, LoggerCategoryCache, 'global.boot.contexts.root.loggerCategoryCache instanceof loggerCategoryCache');
    global.boot = undefined;
  });
  it('boot - config with ValueResolvingConfig ', () => {
    const ephemeralConfig = ConfigFactory.getConfig(new EphemeralConfig({}));
    boot({ config: ephemeralConfig });
    assert.instanceOf(global.boot.contexts.root.config, ValueResolvingConfig, 'global.boot.contexts.root.config instanceof ValueResolvingConfig');
    assert.instanceOf(global.boot.contexts.root.loggerFactory, LoggerFactory, 'global.boot.contexts.root.loggerFactory instanceof LoggerFactory');
    assert.instanceOf(global.boot.contexts.root.loggerCategoryCache, LoggerCategoryCache, 'global.boot.contexts.root.loggerCategoryCache instanceof loggerCategoryCache');
    global.boot = undefined;
  });

  it('boot - config detects global config', () => {
    const ephemeralConfig = new EphemeralConfig({});
    global.config = ephemeralConfig;
    boot();
    assert.instanceOf(global.boot.contexts.root.config, ValueResolvingConfig, 'global.boot.contexts.root.ephemeralConfig instanceof ValueResolvingConfig');
    assert.instanceOf(global.boot.contexts.root.loggerFactory, LoggerFactory, 'global.boot.contexts.root.loggerFactory instanceof LoggerFactory');
    assert.instanceOf(global.boot.contexts.root.loggerCategoryCache, LoggerCategoryCache, 'global.boot.contexts.root.loggerCategoryCache instanceof loggerCategoryCache');
    global.boot = undefined;
    global.config = undefined;
  });

  it('boot - config detects global browser config', () => {
    const ephemeralConfig = new EphemeralConfig({});
    global.window = { config: ephemeralConfig };
    boot();
    assert.instanceOf(global.window.boot.contexts.root.config, ValueResolvingConfig, 'global.boot.contexts.root.config instanceof ValueResolvingConfig');
    assert.instanceOf(global.window.boot.contexts.root.loggerFactory, LoggerFactory, 'global.boot.contexts.root.loggerFactory instanceof LoggerFactory');
    assert.instanceOf(global.window.boot.contexts.root.loggerCategoryCache, LoggerCategoryCache, 'global.boot.contexts.root.loggerCategoryCache instanceof loggerCategoryCache');
    global.boot = undefined;
    global.window = undefined;
  });

  it('boot - LoggerFactory detects boot root context', () => {
    const ephemeralConfig = new EphemeralConfig({ logging: { level: { '/': 'info' } } });
    const cachingLoggerFactory = new CachingLoggerFactory(ephemeralConfig,
      new LoggerCategoryCache());

    boot({ config: ephemeralConfig, loggerFactory: cachingLoggerFactory });
    const cachingLogger = LoggerFactory.getLogger('@alt-javascript/boot/test/boot_spec');

    cachingLogger.info('message');
    assert.equal(cachingLogger.provider.console.cache.length, 1, 'logger.provider.console.cache.length === 1');
    assert.isTrue(cachingLogger.provider.console.cache[0].includes('"level":"info","message":"message"'), 'logger.provider.console.cache[0].includes(\'"level":"info","message":"message"\')');
    global.boot = undefined;
  });

  it('boot - uses config local-development', () => {
    const cachingLoggerFactory = new CachingLoggerFactory(config, new LoggerCategoryCache());
    boot({ config, loggerFactory: cachingLoggerFactory });
    const cachingLogger = LoggerFactory.getLogger('@alt-javascript/boot/test/boot_spec/local-development');

    cachingLogger.debug('message');
    assert.equal(cachingLogger.provider.console.cache.length, 1, 'logger.provider.console.cache.length === 1');
    assert.isTrue(cachingLogger.provider.console.cache[0].includes('"level":"debug","message":"message"'), 'logger.provider.console.cache[0].includes(\'"level":"debug","message":"message"\')');
    global.boot = undefined;
  });

  it('boot - config works', () => {
    const configValue = config.get('spec');
    const altValue = altConfig.get('spec', 'default');

    logger.debug('message');
    // eslint-disable-next-line no-template-curly-in-string
    assert.equal(configValue, '${module}/test/boot_spec', 'configValue === \'${module}/test/boot_spec\'');
    assert.equal(altValue, '@alt-javascript/boot/test/boot_spec', 'configValue === \'@alt-javascript/boot/test/boot_spec\'');
  });
});
