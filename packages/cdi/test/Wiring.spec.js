/* eslint-disable import/extensions */
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { EphemeralConfig } from '@alt-javascript/config';
import { LoggerFactory } from '@alt-javascript/logger';
import { ApplicationContext } from '../index.js';
import { Context, Component, Property } from '../context/index.js';
import ClassA from './service/ClassA.js';
import ClassB from './service/ClassB.js';
import ClassC from './service/ClassC.js';
import SimpleConfigProperty from './service/SimpleConfigProperty.js';

const logger = LoggerFactory.getLogger('@alt-javascript/cdi/test/Wiring_spec');
const { assert } = chai;
chai.use(chaiAsPromised);

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

describe('Wiring Specification', () => {
  it('Classes A & B exist and are autowired by default', async () => {
    const context = new Context([
      new Component(ClassA),
      new Component(ClassB),
      new Component(ClassC)]);

    const applicationContext = new ApplicationContext([context]);
    await applicationContext.start();
    const classA = applicationContext.get('classA');
    const classB = applicationContext.get('classB');
    const classC = applicationContext.get('classC');
    assert.exists(classA, 'classA exists');
    assert.exists(classB, 'classB exists');
    assert.equal(classA, classB.classA, 'classA === classB.classA');
    assert.equal(classB, classA.classB, 'classB === classA.classB');
    assert.equal(classB, classC.classB, 'classB === classC.classB');
    assert.isNull(classA.attribute, 'classA.attribute is null');
    assert.isNull(classB.attribute, 'classB.attribute is null');
    assert.isNull(classC.attribute, 'classC.attribute is null');
  });

  it('SimpleConfigProperty is autowired from config', async () => {
    const ephemeralConfig = new EphemeralConfig(
      {
        pathtovalue: 1,
        context: {
          SimpleConfigProperty: {
            Reference: SimpleConfigProperty,
            // require: './test/service/SimpleConfigProperty',
          },
        },
      },
    );

    const applicationContext = new ApplicationContext({ config: ephemeralConfig });
    await applicationContext.start();

    const simpleConfigProperty = applicationContext.get('simpleConfigProperty');
    assert.exists(simpleConfigProperty, 'simpleConfigProperty exists');
    assert.exists(simpleConfigProperty.attribute, 'simpleClass.attribute exists');
    assert.equal(simpleConfigProperty.attribute, 1, 'simpleClass.attribute == 1');
  });

  it('SimpleConfigProperty is autowired from config by default', async () => {
    const ephemeralConfig = new EphemeralConfig(
      {
        context: {
          SimpleConfigProperty: {
            require: './test/service/SimpleConfigProperty.js',
          },
        },
      },
    );

    const applicationContext = new ApplicationContext({ config: ephemeralConfig });
    await applicationContext.start();

    const simpleConfigProperty = applicationContext.get('simpleConfigProperty');
    assert.exists(simpleConfigProperty, 'simpleConfigProperty exists');
    assert.exists(simpleConfigProperty.attribute, 'simpleClass.attribute exists');
    assert.equal(simpleConfigProperty.attribute, 2, 'simpleClass.attribute == 1');
  });

  it('NoDefaultConfigProperty is autowired from config', async () => {
    const ephemeralConfig = new EphemeralConfig(
      {
        pathtovalue: 1,
        context: {
          SimpleConfigProperty: {
            require: './test/service/NoDefaultConfigProperty.js',
          },
        },
      },
    );

    const applicationContext = new ApplicationContext({ config: ephemeralConfig });
    await applicationContext.start();

    const simpleConfigProperty = applicationContext.get('simpleConfigProperty');
    assert.exists(simpleConfigProperty, 'simpleConfigProperty exists');
    assert.exists(simpleConfigProperty.attribute, 'simpleClass.attribute exists');
    assert.equal(simpleConfigProperty.attribute, 1, 'simpleClass.attribute == 1');
  });

  it('SimpleConfigProperty is wired from context Property definition', async () => {
    const context = new Context([new Component({
      Reference: SimpleConfigProperty,
      properties: [new Property({ name: 'attribute', value: 3 })],
    })]);

    const applicationContext = new ApplicationContext([context]);
    await applicationContext.start();

    const simpleConfigProperty = applicationContext.get('simpleConfigProperty');
    assert.exists(simpleConfigProperty, 'simpleConfigProperty exists');
    assert.exists(simpleConfigProperty.attribute, 'simpleClass.attribute exists');
    assert.equal(simpleConfigProperty.attribute, 3, 'simpleClass.attribute == 3');
  });

  it('SimpleConfigProperty is wired from context property object', async () => {
    const context = new Context([new Component({
      Reference: SimpleConfigProperty,
      properties: [{ name: 'attribute', value: 3 }],
    })]);

    const applicationContext = new ApplicationContext([context]);
    await applicationContext.start();

    const simpleConfigProperty = applicationContext.get('simpleConfigProperty');
    assert.exists(simpleConfigProperty, 'simpleConfigProperty exists');
    assert.exists(simpleConfigProperty.attribute, 'simpleClass.attribute exists');
    assert.equal(simpleConfigProperty.attribute, 3, 'simpleClass.attribute == 3');
  });

  it('ApplicationContext throws nullish', async () => {
    // eslint-disable-next-line no-template-curly-in-string
    const applicationContext = new ApplicationContext({ name: 'aSingleton', attr: '${invalidpath}' });
    await assert.isRejected(
      applicationContext.start(),
      Error,
      'Failed to explicitly autowired placeholder component (aSingleton) property value (attr) from config.',
    );
  });
});
