/* eslint-disable import/extensions */
import { assert } from 'chai';
import fs from 'node:fs';
import path from 'node:path';
import { LoggerFactory } from '@alt-javascript/logger';
import { EphemeralConfig } from '@alt-javascript/config';
import { ApplicationContext } from '../index.js';
import { Context, Singleton } from '../context/index.js';

const logger = LoggerFactory.getLogger('@alt-javascript/cdi/test/Banner_spec');

describe('Banner', () => {
  const fixtureDir = path.resolve(process.cwd(), 'test/fixtures');
  const cwdBanner = path.resolve(process.cwd(), 'banner.md');
  const fixtureBanner = path.resolve(fixtureDir, 'banner.md');
  const bannerContent = fs.readFileSync(fixtureBanner, 'utf8');

  beforeEach(() => {
    // Copy fixture banner to cwd so ApplicationContext finds it
    fs.copyFileSync(fixtureBanner, cwdBanner);
  });

  afterEach(() => {
    // Clean up
    if (fs.existsSync(cwdBanner)) {
      fs.unlinkSync(cwdBanner);
    }
  });

  it('prints banner to console by default (banner-mode not set)', async () => {
    const config = new EphemeralConfig({});
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

  it('prints banner via logger when banner-mode is "log"', async () => {
    const config = new EphemeralConfig({ boot: { 'banner-mode': 'log' } });
    const context = new Context([]);
    const appCtx = new ApplicationContext({ contexts: [context], config });

    // In "log" mode, banner goes through logger.info(), not console.log()
    const consoleLogs = [];
    const origLog = console.log;
    console.log = (...args) => consoleLogs.push(args.join(' '));

    // Capture logger.info calls
    const loggerInfoCalls = [];
    const origInfo = appCtx.logger.info;
    appCtx.logger.info = (...args) => loggerInfoCalls.push(args.join(' '));

    try {
      await appCtx.start({ run: false });
    } finally {
      console.log = origLog;
      appCtx.logger.info = origInfo;
    }

    // Banner should NOT go to console.log
    assert.isFalse(consoleLogs.some((line) => line.includes('_____')),
      'banner should not be printed to console in log mode');

    // Banner SHOULD go to logger.info
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

  it('silently skips when banner.md does not exist', async () => {
    // Remove the banner file
    if (fs.existsSync(cwdBanner)) {
      fs.unlinkSync(cwdBanner);
    }

    const config = new EphemeralConfig({});
    const context = new Context([]);
    const appCtx = new ApplicationContext({ contexts: [context], config });

    // Should not throw
    await appCtx.start({ run: false });
  });
});
