/* eslint-disable import/extensions */
import Selector from './Selector.js';

export default class ParenthesisSelector extends Selector {
  constructor(prefix) {
    super();
    this.prefix = prefix;
  }

  matches(value) {
    return typeof value === 'string' && value.toLowerCase().indexOf(`${this.prefix.toLowerCase()}(`) === 0 && value.lastIndexOf(')') === value.length - 1;
  }

  resolveValue(value) {
    return value.substring(this.prefix.length + 1, value.length - 1);
  }

  async asyncResolveValue(value) {
    return this.resolveValue(value);
  }
}
