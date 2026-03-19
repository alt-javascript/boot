/* eslint-disable import/extensions */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';
import PropertiesParser from './PropertiesParser.js';
import EphemeralConfig from './EphemeralConfig.js';
import EnvPropertySource from './EnvPropertySource.js';
import PropertySourceChain from './PropertySourceChain.js';

/**
 * Profile-aware config file loader following Spring Boot conventions.
 *
 * Precedence (highest → lowest):
 * 1. Programmatic overrides (passed as object)
 * 2. process.env (with relaxed binding)
 * 3. Profile-specific files: application-{profile}.{json,yaml,yml,properties}
 *    (later profiles in NODE_ACTIVE_PROFILES override earlier ones)
 * 4. Default files: application.{json,yaml,yml,properties}
 * 5. Fallback config (e.g. node-config, or passed object)
 *
 * File search locations (in order): config/, cwd
 * File format priority: .properties, .yaml, .yml, .json (all loaded and merged, not exclusive)
 *
 * NODE_ACTIVE_PROFILES: comma-separated list of active profiles.
 */
export default class ProfileConfigLoader {
  static FORMATS = ['.properties', '.yaml', '.yml', '.json'];
  static SEARCH_DIRS = ['config', '.'];

  /**
   * Load config with Spring-aligned precedence.
   *
   * @param {object} [options]
   * @param {object} [options.overrides] - programmatic overrides (highest priority)
   * @param {object} [options.fallback] - fallback config object (lowest priority, e.g. node-config)
   * @param {string} [options.basePath] - base directory for file discovery (default: process.cwd())
   * @param {string} [options.profiles] - comma-separated profiles (default: NODE_ACTIVE_PROFILES env var)
   * @param {object} [options.env] - environment variables (default: process.env)
   * @param {string} [options.name] - config file base name (default: 'application')
   * @returns {PropertySourceChain}
   */
  static load(options = {}) {
    const env = options.env || (typeof process !== 'undefined' ? process.env : {});
    const basePath = options.basePath || (typeof process !== 'undefined' ? process.cwd() : '.');
    const profiles = (options.profiles || env.NODE_ACTIVE_PROFILES || '').split(',').map((p) => p.trim()).filter(Boolean);
    const configName = options.name || 'application';

    const sources = [];

    // 1. Programmatic overrides
    if (options.overrides) {
      sources.push(new EphemeralConfig(options.overrides));
    }

    // 2. Environment variables
    sources.push(new EnvPropertySource(env));

    // 3. Profile-specific files (later profiles = higher priority, so reverse)
    for (let i = profiles.length - 1; i >= 0; i--) {
      const profileSources = ProfileConfigLoader._loadFiles(basePath, `${configName}-${profiles[i]}`);
      sources.push(...profileSources);
    }

    // 4. Default application files
    const defaultSources = ProfileConfigLoader._loadFiles(basePath, configName);
    sources.push(...defaultSources);

    // 5. Fallback
    if (options.fallback) {
      if (typeof options.fallback.has === 'function' && typeof options.fallback.get === 'function') {
        sources.push(options.fallback);
      } else {
        sources.push(new EphemeralConfig(options.fallback));
      }
    }

    return new PropertySourceChain(sources);
  }

  /**
   * Discover and load all config files for a given base name across search directories.
   * Returns an array of EphemeralConfig sources (one per file found).
   *
   * Files in config/ take priority over files in cwd.
   * All format variants are loaded (not exclusive).
   */
  static _loadFiles(basePath, baseName) {
    const sources = [];

    for (const dir of ProfileConfigLoader.SEARCH_DIRS) {
      for (const ext of ProfileConfigLoader.FORMATS) {
        const filePath = join(basePath, dir, `${baseName}${ext}`);
        const data = ProfileConfigLoader._loadFile(filePath, ext);
        if (data !== null) {
          sources.push(new EphemeralConfig(data));
        }
      }
    }

    return sources;
  }

  /**
   * Load and parse a single config file. Returns parsed object or null if not found.
   */
  static _loadFile(filePath, ext) {
    if (!existsSync(filePath)) {
      return null;
    }

    const content = readFileSync(filePath, 'utf-8');

    switch (ext) {
      case '.json':
        return JSON.parse(content);
      case '.yaml':
      case '.yml':
        return ProfileConfigLoader._loadYaml(content);
      case '.properties':
        return PropertiesParser.parse(content);
      default:
        return null;
    }
  }

  /**
   * Load YAML content. js-yaml is optional — if not available, throws a clear error.
   */
  static _loadYaml(content) {
    try {
      // Dynamic import would be cleaner but we need sync
      // eslint-disable-next-line global-require
      const jsYaml = ProfileConfigLoader._getYamlParser();
      return jsYaml.load(content);
    } catch (e) {
      if (e.code === 'MODULE_NOT_FOUND' || e.message?.includes('yaml parser')) {
        throw new Error(
          'YAML config files require js-yaml. Install it: npm install js-yaml',
        );
      }
      throw e;
    }
  }

  /**
   * Resolve the YAML parser. Override in tests or provide via setter.
   */
  static _yamlParser = null;

  static setYamlParser(parser) {
    ProfileConfigLoader._yamlParser = parser;
  }

  static _getYamlParser() {
    if (ProfileConfigLoader._yamlParser) {
      return ProfileConfigLoader._yamlParser;
    }
    try {
      const require = createRequire(import.meta.url);
      const yaml = require('js-yaml');
      ProfileConfigLoader._yamlParser = yaml;
      return yaml;
    } catch {
      throw new Error('No yaml parser available. Install js-yaml or call ProfileConfigLoader.setYamlParser()');
    }
  }
}
