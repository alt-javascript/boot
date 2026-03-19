/* eslint-disable import/extensions */
import { assert } from 'chai';
import { LoggerFactory } from '@alt-javascript/logger';
import { ApplicationContext } from '../index.js';

const logger = LoggerFactory.getLogger('@alt-javascript/cdi/test/Profiles_spec');

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

describe('Profile Specification', () => {
  it('Component with no profile is active when active profiles set', async () => {
    const context = { name: 'SimpleClass', attr: 'value' };

    const applicationContext = new ApplicationContext({ contexts: context, profiles: 'default' });
    await applicationContext.start();

    const simpleClass = applicationContext.get('simpleClass');
    assert.exists(simpleClass, 'simpleClass exists');
  });

  it('Component with profile is not active when no active profiles set', () => {
    const context = { name: 'SimpleClass', attr: 'value', profiles: 'default' };

    const applicationContext = new ApplicationContext({ contexts: context });
    applicationContext.start();

    assert.throws(() => { applicationContext.get('simpleClass'); }, Error, 'Failed component reference lookup for (simpleClass)');
  });

  it('Component with  profile is active when active profiles set', async () => {
    const context = { name: 'SimpleClass', attr: 'value', profiles: 'default' };

    const applicationContext = new ApplicationContext({ contexts: context, profiles: 'default' });
    await applicationContext.start();

    const simpleClass = applicationContext.get('simpleClass');
    assert.exists(simpleClass, 'simpleClass exists');
  });

  it('Component with profile is not active when different active profiles set', async () => {
    const context = { name: 'SimpleClass', attr: 'value', profiles: 'default' };

    const applicationContext = new ApplicationContext({ contexts: context, profiles: 'other' });
    applicationContext.start();

    assert.throws(() => { applicationContext.get('simpleClass'); }, Error, 'Failed component reference lookup for (simpleClass)');
  });
  it('Component with profile negation is active when different active profiles set', async () => {
    const context = { name: 'SimpleClass', attr: 'value', profiles: '!default' };

    const applicationContext = new ApplicationContext({ contexts: context, profiles: 'other' });
    await applicationContext.start();
    const simpleClass = applicationContext.get('simpleClass');

    assert.exists(simpleClass, 'simpleClass exists');
  });
});
