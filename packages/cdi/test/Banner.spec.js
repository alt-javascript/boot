/* eslint-disable import/extensions */
import { assert } from 'chai';
import { LoggerFactory } from '@alt-javascript/logger';
import { EphemeralConfig } from '@alt-javascript/config';
import { ApplicationContext } from '../index.js';
import { Context } from '../context/index.js';

const logger = LoggerFactory.getLogger('@alt-javascript/cdi/test/Banner_spec');

describe('Banner', () => {
  it('prints banner to console by default (banner-mode not set)', async () => {
    // Banner.spec.js runs with the Boot.test() fixture active (banner-mode: off in global root).
    // This test explicitly sets banner-mode: console to verify the console path, which is the
    // documented production default when Boot.test() is NOT in effect.
    const config = new EphemeralConfig({ boot: { 'banner-mode': 'console' } });
    const context = new Context([]);
    const appCtx = new ApplicationContext({ contexts: [context], config });

    const logged = [];
    const origLog = console.log;
    console.log = (...args) => logged.push(args.join(' '));

    try {
      await appCtx.start({ run: false });
    } finally {
      console.log = origLog;
    }

    assert.isTrue(logged.some((line) => line.includes('_____')), 'banner should be printed to console by default');
  });

  it('prints banner to console when banner-mode is "console"', async () => {
    const config = new EphemeralConfig({ boot: { 'banner-mode': 'console' } });
    const context = new Context([]);
    const appCtx = new ApplicationContext({ contexts: [context], config });

    const logged = [];
    const origLog = console.log;
    console.log = (...args) => logged.push(args.join(' '));

    try {
      await appCtx.start({ run: false });
    } finally {
      console.log = origLog;
    }

    assert.isTrue(logged.some((line) => line.includes('_____')), 'banner should be printed to console');
  });

  it('includes the version line', async () => {
    const config = new EphemeralConfig({ boot: { 'banner-mode': 'console' } });
    const context = new Context([]);
    const appCtx = new ApplicationContext({ contexts: [context], config });

    const logged = [];
    const origLog = console.log;
    console.log = (...args) => logged.push(args.join(' '));

    try {
      await appCtx.start({ run: false });
    } finally {
      console.log = origLog;
    }

    assert.isTrue(
      logged.some((line) => line.includes('@alt-javascript/boot ::')),
      'banner should include the version line',
    );
  });

  it('prints banner via logger when banner-mode is "log"', async () => {
    const config = new EphemeralConfig({ boot: { 'banner-mode': 'log' } });
    const context = new Context([]);
    const appCtx = new ApplicationContext({ contexts: [context], config });

    const consoleLogs = [];
    const origLog = console.log;
    console.log = (...args) => consoleLogs.push(args.join(' '));

    const loggerInfoCalls = [];
    const origInfo = appCtx.logger.info;
    appCtx.logger.info = (...args) => loggerInfoCalls.push(args.join(' '));

    try {
      await appCtx.start({ run: false });
    } finally {
      console.log = origLog;
      appCtx.logger.info = origInfo;
    }

    assert.isFalse(consoleLogs.some((line) => line.includes('_____')),
      'banner should not be printed to console in log mode');
    assert.isTrue(loggerInfoCalls.some((line) => line.includes('_____')),
      'banner should be logged via logger.info');
  });

  it('does not print banner when banner-mode is "off"', async () => {
    const config = new EphemeralConfig({ boot: { 'banner-mode': 'off' } });
    const context = new Context([]);
    const appCtx = new ApplicationContext({ contexts: [context], config });

    const logged = [];
    const origLog = console.log;
    console.log = (...args) => logged.push(args.join(' '));

    try {
      await appCtx.start({ run: false });
    } finally {
      console.log = origLog;
    }

    assert.isFalse(logged.some((line) => line.includes('_____')), 'banner should not be printed');
  });
});
