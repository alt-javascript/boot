/* eslint-disable import/extensions */
import Resolver from './Resolver.js';

/** Resolver that only processes values matching a Selector pattern. */
export default class SelectiveResolver extends Resolver {
  constructor(selector) {
    super();
    this.selector = selector;
  }
}
