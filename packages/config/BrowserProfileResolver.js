/**
 * BrowserProfileResolver — resolves active profiles from the browser URL.
 *
 * Replaces the v2 WindowLocationSelectiveConfig approach (URL-as-config-key
 * with dot→+ encoding) with a declarative URL-to-profile mapping:
 *
 *   profiles: {
 *     urls: {
 *       'localhost:8080': 'dev',
 *       'localhost:3000': 'dev',
 *       'staging.example.com': 'staging',
 *       '*.example.com': 'prod',
 *     }
 *   }
 *
 * Matching rules:
 *   1. Exact match on host:port (port included only if non-standard)
 *   2. Exact match on hostname
 *   3. Wildcard match (*.example.com matches app.example.com)
 *   4. Query parameter ?profile=dev overrides URL mapping
 *   5. Falls back to 'default' if no match
 *
 * This makes browser profile resolution symmetric with server-side
 * NODE_ACTIVE_PROFILES — the same conditionalOnProfile('dev') works
 * in both environments.
 */
export default class BrowserProfileResolver {
  /**
   * Resolve active profiles from URL and config.
   *
   * @param {object} [options]
   * @param {object} [options.urlMappings] — URL-to-profile map
   * @param {string} [options.locationHref] — full URL (default: window.location.href)
   * @param {string} [options.queryParam] — query param name (default: 'profile')
   * @returns {string[]} active profile names
   */
  static resolve(options = {}) {
    const urlMappings = options.urlMappings || {};
    const queryParam = options.queryParam || 'profile';

    let url;
    try {
      const href = options.locationHref
        || (typeof window !== 'undefined' ? window.location.href : 'http://localhost');
      url = new URL(href);
    } catch {
      return ['default'];
    }

    // 1. Query parameter override: ?profile=dev or ?profile=dev,staging
    const queryProfile = url.searchParams.get(queryParam);
    if (queryProfile) {
      return queryProfile.split(',').map((p) => p.trim()).filter(Boolean);
    }

    // 2. URL mapping
    const hostPort = url.port && url.port !== '80' && url.port !== '443'
      ? `${url.hostname}:${url.port}`
      : url.hostname;

    // Try exact host:port match
    if (urlMappings[hostPort]) {
      return BrowserProfileResolver._toArray(urlMappings[hostPort]);
    }

    // Try hostname-only match (without port)
    if (url.port && urlMappings[url.hostname]) {
      return BrowserProfileResolver._toArray(urlMappings[url.hostname]);
    }

    // Try wildcard match (*.example.com)
    for (const pattern of Object.keys(urlMappings)) {
      if (pattern.startsWith('*.')) {
        const suffix = pattern.slice(1); // .example.com
        if (url.hostname.endsWith(suffix) && url.hostname !== suffix.slice(1)) {
          return BrowserProfileResolver._toArray(urlMappings[pattern]);
        }
      }
    }

    // 3. Default
    return ['default'];
  }

  /**
   * Normalise a profile value to an array.
   * Supports: 'dev', 'dev,staging', ['dev', 'staging']
   */
  static _toArray(value) {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      return value.split(',').map((p) => p.trim()).filter(Boolean);
    }
    return ['default'];
  }
}
