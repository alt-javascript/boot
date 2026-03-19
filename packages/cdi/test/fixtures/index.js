/* eslint-disable import/extensions */
import { config } from '@alt-javascript/config';
import { test } from '@alt-javascript/boot';
import { LoggerFactory } from '@alt-javascript/logger';

test({ config });

const logger = LoggerFactory.getLogger('@alt-javascript/cdi/test/fixtures/index');

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
