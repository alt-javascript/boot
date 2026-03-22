/**
 * example-2-intro-logger
 *
 * Introduces @alt-javascript/logger alongside config.
 * No CDI, no boot — just config + manual logger setup.
 *
 * Key concepts:
 *   - LoggerFactory.getLogger(category, config) creates a configured logger
 *   - Category string mirrors Java's package.ClassName convention — used for level filtering
 *   - Log format (text/JSON) and level controlled by config
 *   - static qualifier on classes gives the logger a stable, meaningful category name
 *
 * Run:
 *   npm start                  # text logs, debug level for this category
 *   npm run start:dev          # text logs, warn level (debug/info suppressed)
 *   npm run start:json-log     # JSON log lines
 */
import { ProfileConfigLoader } from '@alt-javascript/config';
import { LoggerFactory, LoggerCategoryCache } from '@alt-javascript/logger';

const config = ProfileConfigLoader.load();

// Wire up the logger manually (Boot.boot() does this automatically in later examples).
const loggerCategoryCache = new LoggerCategoryCache();
const loggerFactory = new LoggerFactory(config, loggerCategoryCache);

// Get a logger for this module using a qualified category name.
// The category controls which log level config entry applies.
const logger = loggerFactory.getLogger('@alt-javascript/example-2-intro-logger/main');

logger.debug('Config loaded — debug visible when level is debug');
logger.info(`App: ${config.get('app.name')}`);
logger.info(`Log format: ${config.get('logging.format', 'text')}`);
logger.warn('This is a warning');
logger.error('This is an error');

// Category-specific level filtering
const svcLogger = loggerFactory.getLogger('@alt-javascript/example-2-intro-logger/MyService');
svcLogger.debug('MyService debug — filtered by category level');
svcLogger.info('MyService info — visible at info+');
