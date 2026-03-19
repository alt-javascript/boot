/**
 * Isomorphic application event publisher.
 *
 * No dependency on Node's EventEmitter — works in browser ESM.
 * Subscribe by event type (class constructor or string name).
 * Publish events to all matching subscribers.
 */
export default class ApplicationEventPublisher {
  constructor() {
    /** @type {Map<string, Array<Function>>} event type name → listener functions */
    this.listeners = new Map();
    /** Wildcard listeners that receive all events */
    this.wildcardListeners = [];
  }

  /**
   * Subscribe to an event type.
   *
   * @param {Function|string} eventType — event class constructor or string type name, or '*' for all
   * @param {Function} listener — callback(event)
   * @returns {Function} unsubscribe function
   */
  on(eventType, listener) {
    if (typeof listener !== 'function') {
      throw new Error('ApplicationEventPublisher.on: listener must be a function');
    }

    if (eventType === '*' || eventType === 'all') {
      this.wildcardListeners.push(listener);
      return () => {
        const idx = this.wildcardListeners.indexOf(listener);
        if (idx >= 0) this.wildcardListeners.splice(idx, 1);
      };
    }

    const typeName = typeof eventType === 'string' ? eventType : eventType.name;

    if (!this.listeners.has(typeName)) {
      this.listeners.set(typeName, []);
    }
    this.listeners.get(typeName).push(listener);

    return () => {
      const arr = this.listeners.get(typeName);
      if (arr) {
        const idx = arr.indexOf(listener);
        if (idx >= 0) arr.splice(idx, 1);
      }
    };
  }

  /**
   * Publish an event to all matching listeners.
   *
   * @param {ApplicationEvent|Object} event — must have constructor.name or type property
   */
  publish(event) {
    const typeName = event?.constructor?.name !== 'Object'
      ? event.constructor.name
      : event.type;

    // Type-specific listeners
    if (typeName && this.listeners.has(typeName)) {
      for (const listener of this.listeners.get(typeName)) {
        listener(event);
      }
    }

    // String type property (if different from class name)
    if (event.type && event.type !== typeName && this.listeners.has(event.type)) {
      for (const listener of this.listeners.get(event.type)) {
        listener(event);
      }
    }

    // Wildcard listeners
    for (const listener of this.wildcardListeners) {
      listener(event);
    }
  }

  /** Remove all listeners. */
  clear() {
    this.listeners.clear();
    this.wildcardListeners = [];
  }

  /** @returns {number} total registered listeners including wildcards */
  get listenerCount() {
    let count = this.wildcardListeners.length;
    for (const arr of this.listeners.values()) {
      count += arr.length;
    }
    return count;
  }
}
