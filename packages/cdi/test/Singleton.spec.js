/* eslint-disable import/extensions */
import { assert } from 'chai';
import { LoggerFactory } from '@alt-javascript/logger';
import { ApplicationContext } from '../index.js';
import {
  Context, Component, Singleton, Service,
} from '../context/index.js';
import SimpleClass from './service/SimpleClass.js';

const logger = LoggerFactory.getLogger('@alt-javascript/cdi/test/Singleton_spec');

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

describe('Singleton Specification', () => {
  it('Simple Component is a singleton', async () => {
    const context = new Context([new Component(SimpleClass)]);

    const applicationContext = new ApplicationContext([context]);
    await applicationContext.start();
    const simpleClass = applicationContext.get('simpleClass');
    const simpleClass2 = applicationContext.get('simpleClass');
    assert.exists(simpleClass, 'simpleClass exists');
    assert.equal(simpleClass.uuid, simpleClass2.uuid, 'simpleClass.uuid === simpleClass2.uuid');
  });

  it('Simple Singleton is a singleton', async () => {
    const context = new Context([new Service(SimpleClass)]);

    const applicationContext = new ApplicationContext([context]);
    await applicationContext.start();
    const simpleClass = applicationContext.get('simpleClass');
    assert.exists(simpleClass, 'simpleClass exists');
  });
  it('Simple Singleton is a singleton using Reference', async () => {
    const context = new Context([new Singleton({ Reference: SimpleClass })]);

    const applicationContext = new ApplicationContext([context]);
    await applicationContext.start();
    const simpleClass = applicationContext.get('simpleClass');
    assert.exists(simpleClass, 'simpleClass exists');
  });
});
