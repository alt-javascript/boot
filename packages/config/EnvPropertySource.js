/**
 * Wraps process.env as a property source with relaxed binding.
 *
 * Relaxed binding follows Spring conventions:
 * - MY_APP_PORT → my.app.port
 * - Underscores become dots, uppercase becomes lowercase
 * - Double underscores (__) become dots (for nested keys)
 * - Direct env var name also accessible (MY_APP_PORT)
 */
export default class EnvPropertySource {
  constructor(env) {
    this.env = env || (typeof process !== 'undefined' ? process.env : {});
    this._cache = null;
  }

  /**
   * Build a reverse lookup: dotted-lowercase → env value.
   */
  _getCache() {
    if (this._cache) return this._cache;
    this._cache = new Map();
    for (const [key, value] of Object.entries(this.env)) {
      // Store original key
      this._cache.set(key, value);
      // Store relaxed form: MY_APP_PORT → my.app.port
      const relaxed = key
        .replace(/__/g, '.')  // double underscore → dot first
        .replace(/_/g, '.')   // single underscore → dot
        .toLowerCase();
      if (relaxed !== key) {
        this._cache.set(relaxed, value);
      }
    }
    return this._cache;
  }

  has(path) {
    return this._getCache().has(path);
  }

  get(path, defaultValue) {
    const cache = this._getCache();
    if (cache.has(path)) {
      return cache.get(path);
    }
    if (typeof defaultValue !== 'undefined') {
      return defaultValue;
    }
    return undefined;
  }
}
