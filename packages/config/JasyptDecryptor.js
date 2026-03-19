/* eslint-disable import/extensions */
import Jasypt from '@alt-javascript/jasypt';
import Resolver from './Resolver.js';
import SelectiveResolver from './SelectiveResolver.js';
import PrefixSelector from './PrefixSelector.js';

export default class JasyptDecryptor extends SelectiveResolver {
  constructor(selector, password) {
    super(selector || (new PrefixSelector('enc.')));
    this.jasypt = new Jasypt();
    this.password = password || process.env.NODE_CONFIG_PASSPHRASE || 'changeit';
  }

  resolve(config) {
    const self = this;
    const resolvedConfig = Resolver.prototype.mapValuesDeep(config, (v) => {
      if (self.selector.matches(v)) {
        try {
          const selectedValue = self.selector.resolveValue(v);
          const decryptedValue = self.jasypt.decrypt(selectedValue,this.password);
          return decryptedValue;
        } catch (e) {
          return v;
        }
      }
      return v;
    });
    return resolvedConfig;
  }
}
