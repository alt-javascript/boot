/**
 * Layered property source chain with precedence ordering.
 *
 * Sources are queried in priority order (index 0 = highest priority).
 * First source that has the property wins.
 *
 * Implements the same has()/get() contract as EphemeralConfig.
 */
export default class PropertySourceChain {
  /**
   * @param {Array<{has: function, get: function}>} sources - ordered by priority (highest first)
   */
  constructor(sources = []) {
    this.sources = sources;
  }

  /**
   * Add a source at the given priority position.
   * Lower index = higher priority.
   * @param {object} source - must have has(path) and get(path, defaultValue)
   * @param {number} [priority] - index to insert at; defaults to end (lowest priority)
   */
  addSource(source, priority) {
    if (typeof priority === 'number') {
      this.sources.splice(priority, 0, source);
    } else {
      this.sources.push(source);
    }
  }

  has(path) {
    for (const source of this.sources) {
      if (source.has(path)) {
        return true;
      }
    }
    return false;
  }

  get(path, defaultValue) {
    for (const source of this.sources) {
      if (source.has(path)) {
        return source.get(path);
      }
    }
    if (typeof defaultValue !== 'undefined') {
      return defaultValue;
    }
    throw new Error(`Config path ${path} returned no value.`);
  }
}
