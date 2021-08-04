const { config } = require('@alt-javascript/config');
const { test } = require('../..');
const { LoggerFactory } = require('@alt-javascript/logger');

test({ config });

const logger = LoggerFactory.getLogger('@alt-javascript/logger/test/fixtures/index', config);

exports.mochaGlobalSetup = async function setup() {
  logger.verbose('mocha global setup: started');
  //  ...
  logger.verbose('mocha global setup: completed');
};

exports.mochaGlobalTeardown = async function teardown() {
  logger.verbose('mocha global teardown: started');
  //  ...
  logger.verbose('mocha global teardown: completed');
};
