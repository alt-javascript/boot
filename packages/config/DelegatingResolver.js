/* eslint-disable import/extensions */
import Resolver from './Resolver.js';

/** Chains multiple resolvers, applying each in sequence to the config tree. */
export default class DelegatingResolver extends Resolver {
  constructor(resolvers) {
    super();
    this.resolvers = resolvers;
  }

  resolve(config) {
    let resolvedConfig = config;
    for (let i = 0; i < this.resolvers.length; i++) {
      resolvedConfig = this.resolvers[i].resolve(resolvedConfig);
    }
    return resolvedConfig;
  }
}
