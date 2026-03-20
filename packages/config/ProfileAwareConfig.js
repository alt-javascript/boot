/**
 * ProfileAwareConfig — config wrapper that overlays profile-specific sections.
 *
 * Given a config object with top-level profile sections:
 *
 *   {
 *     api: { url: 'http://prod.example.com' },
 *     logging: { level: { '/': 'warn' } },
 *     profiles: {
 *       urls: { 'localhost:8080': 'dev' },
 *       dev: {
 *         api: { url: 'http://localhost:8081' },
 *         logging: { level: { '/': 'debug' } },
 *       },
 *       staging: {
 *         api: { url: 'http://staging.example.com' },
 *       },
 *     },
 *   }
 *
 * When the active profile is 'dev', `config.get('api.url')` returns
 * 'http://localhost:8081'. When no profile matches, defaults apply.
 *
 * This replaces WindowLocationSelectiveConfig's URL-key approach with
 * a clean profile-based overlay, symmetric with server-side profiles.
 */
import EphemeralConfig from './EphemeralConfig.js';

export default class ProfileAwareConfig {
  /**
   * @param {object} configObject — raw config with optional `profiles` section
   * @param {string[]} activeProfiles — resolved profile names
   */
  constructor(configObject, activeProfiles = ['default']) {
    this._raw = configObject;
    this._activeProfiles = activeProfiles;
    this._profileConfigs = [];
    this._baseConfig = new EphemeralConfig(this._stripProfiles(configObject));

    // Build profile overlay chain (later profiles override earlier)
    const profileDefs = configObject.profiles || {};
    for (const profile of activeProfiles) {
      if (profileDefs[profile]) {
        this._profileConfigs.push(new EphemeralConfig(profileDefs[profile]));
      }
    }
  }

  /** @returns {string[]} active profile names */
  get activeProfiles() {
    return [...this._activeProfiles];
  }

  /**
   * Check if a config path exists.
   * Checks profile overlays first (in order), then base config.
   */
  has(path) {
    for (const pc of this._profileConfigs) {
      if (pc.has(path)) return true;
    }
    return this._baseConfig.has(path);
  }

  /**
   * Get a config value.
   * Profile overlays take precedence over base config.
   */
  get(path, defaultValue) {
    for (const pc of this._profileConfigs) {
      if (pc.has(path)) return pc.get(path);
    }
    return this._baseConfig.get(path, defaultValue);
  }

  /**
   * Strip the `profiles` section from the config object to produce
   * the base config without profile definitions or URL mappings.
   */
  _stripProfiles(obj) {
    if (!obj || !obj.profiles) return obj;
    const copy = { ...obj };
    delete copy.profiles;
    return copy;
  }
}
