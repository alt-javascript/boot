/** Caches logger instances by category to avoid redundant construction. */
export default class LoggerCategoryCache {
  constructor() {
    this.cache = {};
  }

  get(category) {
    return this.cache[category];
  }

  put(category, level) {
    this.cache[category] = level;
  }
}
