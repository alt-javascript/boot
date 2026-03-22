/* eslint-disable import/extensions */
import { assert } from 'chai';
import { EphemeralConfig } from '@alt-javascript/config';
import { printBanner } from '../../boot/index.js';

describe('Banner', () => {
  it('prints banner to console when banner-mode is "console"', () => {
    const config = new EphemeralConfig({ boot: { 'banner-mode': 'console' } });

    const logged = [];
    const origLog = console.log;
    console.log = (...args) => logged.push(args.join(' '));

    try {
      printBanner(config);
    } finally {
      console.log = origLog;
    }

    assert.isTrue(logged.some((line) => line.includes('_____')), 'banner should be printed to console');
  });

  it('prints banner to console by default (banner-mode not set)', () => {
    // No banner-mode in config → defaults to console.
    const config = new EphemeralConfig({});

    const logged = [];
    const origLog = console.log;
    console.log = (...args) => logged.push(args.join(' '));

    try {
      printBanner(config);
    } finally {
      console.log = origLog;
    }

    assert.isTrue(logged.some((line) => line.includes('_____')), 'banner should be printed to console by default');
  });

  it('includes the version line', () => {
    const config = new EphemeralConfig({ boot: { 'banner-mode': 'console' } });

    const logged = [];
    const origLog = console.log;
    console.log = (...args) => logged.push(args.join(' '));

    try {
      printBanner(config);
    } finally {
      console.log = origLog;
    }

    assert.isTrue(
      logged.some((line) => line.includes('@alt-javascript/boot ::')),
      'banner should include the version line',
    );
  });

  it('prints banner via logger when banner-mode is "log"', () => {
    const config = new EphemeralConfig({ boot: { 'banner-mode': 'log' } });

    const consoleLogs = [];
    const origLog = console.log;
    console.log = (...args) => consoleLogs.push(args.join(' '));

    const loggerInfoCalls = [];
    const mockLogger = { info: (...args) => loggerInfoCalls.push(args.join(' ')) };

    try {
      printBanner(config, mockLogger);
    } finally {
      console.log = origLog;
    }

    assert.isFalse(consoleLogs.some((line) => line.includes('_____')),
      'banner should not be printed to console in log mode');
    assert.isTrue(loggerInfoCalls.some((line) => line.includes('_____')),
      'banner should be logged via logger.info');
  });

  it('does not print banner when banner-mode is "off"', () => {
    const config = new EphemeralConfig({ boot: { 'banner-mode': 'off' } });

    const logged = [];
    const origLog = console.log;
    console.log = (...args) => logged.push(args.join(' '));

    try {
      printBanner(config);
    } finally {
      console.log = origLog;
    }

    assert.isFalse(logged.some((line) => line.includes('_____')), 'banner should not be printed');
  });
});
