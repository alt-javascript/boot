/* eslint-disable import/extensions */
import { isPlainObject } from '@alt-javascript/common';
import EphemeralConfig from './EphemeralConfig.js';

export default class DelegatingConfig {
  constructor(config, path) {
    if (isPlainObject(config)) {
      this.config = new EphemeralConfig(config);
    } else {
      this.config = config;
    }
    const originalConfig = this.config;
    Object.assign(this, config);
    this.config = originalConfig;
    this.path = path;
  }

  has(path) {
    return this.config.has(path);
  }
}
