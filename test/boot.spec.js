const {assert} = require('chai');
const {config} = require('@alt-javascript/config');
const decorates = require('../decorates');
const Sweet = require('./decorators/Sweet');
const Cake = require('./decorated/Cake');
const Jelly = require('./decorated/Jelly');
const Jerky = require('./decorated/Jerky');
const Crisps = require('./decorated/Crisps');
const Ramen = require('./decorated/Ramen');
const TomYum = require('./decorated/TomYum');

const {LoggerFactory} = require('@alt-javascript/logger');
const logger = LoggerFactory.getLogger(config,'@alt-javascript/decorates/test/boot_spec');


before(async () => {
  logger.verbose(`before spec setup started`);
  // ..
  logger.verbose(`before spec setup completed`);
});

beforeEach(async () => {
  logger.verbose(`before each setup started`);
  // ..
  logger.verbose(`before each setup completed`);
});

after(async () => {
  logger.verbose(`after teardown started`);
  // ...
  logger.verbose(`after teardown completed`);
});

beforeEach(async () => {
  logger.verbose(`before each setup started`);
  // ..
  logger.verbose(`before each setup completed`);
});

describe('String based decorators', () => {

});
