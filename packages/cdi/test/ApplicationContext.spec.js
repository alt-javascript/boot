/* eslint-disable import/extensions */
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { LoggerFactory } from '@alt-javascript/logger';
import { EphemeralConfig } from '@alt-javascript/config';
import { v4 as uuidv4 } from 'uuid';
import { ApplicationContext } from '../index.js';
import { Context, Component } from '../context/index.js';
import SimpleClass from './service/SimpleClass.js';

const logger = LoggerFactory.getLogger('@alt-javascript/cdi/test/ApplicationContext_spec.js');
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

describe('ApplicationContext Specification', () => {
  it('ApplicationContext accepts nullish', async () => {
    const context = new Context();

    const applicationContext = new ApplicationContext([context]);
    await applicationContext.start();

    const config = applicationContext.get('config');
    assert.exists(config, 'config exists');
  });

  it('ApplicationContext throws nullish', async () => {
    const applicationContext = new ApplicationContext([null]);
    await assert.isRejected(applicationContext.start(), Error, 'ApplicationContext (default) received a nullish context.');
  });

  it('ApplicationContext accepts nullish components', async () => {
    const applicationContext = new ApplicationContext([new Context(null)]);
    await assert.isFulfilled(applicationContext.start(), 'new ApplicationContext([new Context(null)] is ok');
  });
  it('ApplicationContext fails on dupe', async () => {
    const context = new Context([new Component(SimpleClass), new Component(SimpleClass)]);

    const applicationContext = new ApplicationContext([context]);
    await assert.isRejected(applicationContext.start(), Error, 'Duplicate definition of application context component (simpleClass)');
  });

  it('ApplicationContext accepts Context array', async () => {
    const context = new Context([new Component(SimpleClass)]);

    const applicationContext = new ApplicationContext([context]);
    await applicationContext.start();

    const simpleClass = applicationContext.get('simpleClass');
    assert.exists(simpleClass, 'simpleClass exists');
  });

  it('ApplicationContext accepts Context object', async () => {
    const context = new Context(new Component(SimpleClass));

    const applicationContext = new ApplicationContext(context);
    await applicationContext.start();

    const simpleClass = applicationContext.get('simpleClass');
    assert.exists(simpleClass, 'simpleClass exists');
  });

  it('ApplicationContext accepts Component object', async () => {
    const context = new Component(SimpleClass);

    const applicationContext = new ApplicationContext(context);
    await applicationContext.start();

    const simpleClass = applicationContext.get('simpleClass');
    assert.exists(simpleClass, 'simpleClass exists');
  });

  it('ApplicationContext accepts plain old class', async () => {
    const context = SimpleClass;

    const applicationContext = new ApplicationContext(context);
    await applicationContext.start();

    const simpleClass = applicationContext.get('simpleClass');
    assert.exists(simpleClass, 'simpleClass exists');
  });

  it('ApplicationContext accepts plain old object', async () => {
    const context = { name: 'SimpleClass', uuid: uuidv4() };

    const applicationContext = new ApplicationContext(context);
    await applicationContext.start();

    const simpleClass = applicationContext.get('simpleClass');
    assert.exists(simpleClass, 'simpleClass exists');
  });

  it('ApplicationContext accepts plain old object, with require', async () => {
    const context = {
      name: 'SimpleClass',
      require: './test/service/SimpleClass.js',
    };

    const applicationContext = new ApplicationContext(context);
    await applicationContext.start();

    const simpleClass = applicationContext.get('simpleClass');
    assert.exists(simpleClass, 'simpleClass exists');
    assert.exists(simpleClass.uuid, 'simpleClass.uuid exists');
  });

  it('ApplicationContext accepts config context', async () => {
    const ephemeralConfig = new EphemeralConfig(
      {
        context: {
          Reference: SimpleClass,
        },
      },
    );

    const applicationContext = new ApplicationContext({ config: ephemeralConfig });
    await applicationContext.start();

    const simpleClass = applicationContext.get('simpleClass');
    assert.exists(simpleClass, 'simpleClass exists');
    assert.exists(simpleClass.uuid, 'simpleClass.uuid exists');
  });
});
