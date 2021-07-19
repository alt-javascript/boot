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
const logger = LoggerFactory.getLogger(config,'@alt-javascript/decorates/test/decorates_spec');


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

  it('string vs string', () => {
    assert.isTrue(decorates('Sweet','Sweet'), "'Sweet' decorates 'Sweet' is true");
    assert.isFalse(decorates('Sweet','Salty'), "'Sweet' decorates 'Salty' is false");
  });

  it('function vs string', () => {
    assert.isTrue(decorates(Sweet,'Sweet'), "Sweet decorates 'Sweet' is true");
    assert.isFalse(decorates(Sweet,'Salty'), "Sweet decorates 'Salty' is false");
  });

  it('class vs string', () => {
    assert.isTrue(decorates(Sweet(),'Sweet'), "Sweet() decorates 'Sweet' is true");
    assert.isFalse(decorates(Sweet(),'Salty'), "Sweet() decorates 'Salty' is false");
  });

  it('string vs class.is = string', () => {
    assert.isTrue(decorates('Sweet',Cake), "'Sweet' decorates Cake is true");
    assert.isFalse(decorates('Sweet',Jerky), "'Sweet' decorates Jerky is false");
  });

  it('string vs class.is = class', () => {
    assert.isTrue(decorates('Sweet',Jelly), "'Sweet' decorates Jelly is true");
    assert.isFalse(decorates('Sweet',Crisps), "'Sweet' decorates Crisps is false");
  });

  it('string vs class.with = string', () => {
    assert.isTrue(decorates('Warm',Ramen), "'Warm' decorates Ramen is true");
    assert.isTrue(decorates('Salty',Ramen), "'Salty' decorates Ramen is true");
    assert.isFalse(decorates('Sweet',Ramen), "'Sweet' decorates Crisps is false");
  });

  it('multi-with', () => {
    assert.isTrue(decorates('Sweet',TomYum), "'Sweet' decorates TomYum is true");
    assert.isTrue(decorates('Sour',TomYum), "'Sour' decorates TomYum is true");
    assert.isTrue(decorates('Spicy',TomYum), "'Spicy' decorates TomYum is true");
    assert.isFalse(decorates('Salty',TomYum), "'Salty' decorates TomYum is false");
    assert.isFalse(decorates('Warm',TomYum), "'Warm' decorates TomYum is false");
  });

});
