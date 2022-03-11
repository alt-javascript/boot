/* eslint-disable import/extensions */
import { config } from '@alt-javascript/config';
import { LoggerFactory } from '@alt-javascript/logger';
import { test } from '../../index.js';

test({ config });

const logger = LoggerFactory.getLogger('@alt-javascript/logger/test/fixtures/index', config);

export async function mochaGlobalSetup() {
  logger.verbose('mocha global setup: started');
  //  ...
  logger.verbose('mocha global setup: completed');
}

export async function mochaGlobalTeardown() {
  logger.verbose('mocha global teardown: started');
  //  ...
  logger.verbose('mocha global teardown: completed');
}
