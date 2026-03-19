/**
 * Auto-Discovery — Pure JS component scanning for @alt-javascript/cdi
 *
 * Classes declare static __component to self-identify as context components.
 * The scan() function reads this metadata and returns component definitions.
 * ComponentRegistry provides programmatic registration as a complement.
 */

/** Metadata key — classes declare this as a static property to opt in. */
export const COMPONENT_META_KEY = '__component';

/**
 * Programmatic component registry.
 * Register classes/objects here and drain during ApplicationContext startup.
 */
export class ComponentRegistry {
  constructor() {
    this.components = new Map();
  }

  /**
   * Register a class or object as a component.
   *
   * @param {Function|Object} target — class constructor or plain object
   * @param {Object} [options] — component options (scope, name, profiles, properties, etc.)
   * @returns {Function|Object} the target (for chaining)
   */
  register(target, options) {
    const name = options?.name
      || (target?.name ? target.name.charAt(0).toLowerCase() + target.name.slice(1) : undefined);

    if (!name) {
      throw new Error('ComponentRegistry.register: name is required (provide options.name or use a named class)');
    }

    const meta = {
      Reference: target,
      name,
      scope: options?.scope || 'singleton',
      qualifier: options?.qualifier,
      profiles: options?.profiles,
      properties: options?.properties,
      condition: options?.condition,
      factory: options?.factory,
      factoryFunction: options?.factoryFunction,
      factoryArgs: options?.factoryArgs,
      wireFactory: options?.wireFactory,
      require: options?.require,
    };

    this.components.set(name, meta);
    return target;
  }

  /**
   * Drain all registered components as an array. Clears the registry.
   * @returns {Array}
   */
  drain() {
    const result = Array.from(this.components.values());
    this.components.clear();
    return result;
  }

  /** @returns {number} */
  get size() {
    return this.components.size;
  }

  /** Clear all registrations. */
  clear() {
    this.components.clear();
  }
}

/** Default singleton registry instance. */
export const defaultRegistry = new ComponentRegistry();

/**
 * Scan classes for static __component metadata and return component definitions.
 *
 * @param {Array<Function|Object>} classes — classes to scan
 * @returns {Array} component definitions
 */
export function scan(classes) {
  const components = [];

  for (const cls of classes) {
    if (cls == null) continue;

    const meta = cls[COMPONENT_META_KEY];
    if (meta == null) continue;

    const options = meta === true ? {}
      : (typeof meta === 'string' ? { scope: meta } : meta);

    const name = options.name
      || (cls.name ? cls.name.charAt(0).toLowerCase() + cls.name.slice(1) : undefined);

    if (!name) continue;

    components.push({
      Reference: cls,
      name,
      scope: options.scope || 'singleton',
      qualifier: options.qualifier,
      profiles: options.profiles,
      properties: options.properties,
      condition: options.condition,
    });
  }

  return components;
}

/**
 * Convenience: scan classes AND drain the default registry, merged.
 *
 * @param {Array<Function|Object>} [classes] — classes to scan
 * @returns {Array} merged component definitions
 */
export function discover(classes) {
  const scanned = classes ? scan(classes) : [];
  const registered = defaultRegistry.drain();
  return [...scanned, ...registered];
}
