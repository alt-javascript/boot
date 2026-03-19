/* eslint-disable import/extensions */
import npmconfig from 'config';
import { getGlobalRoot } from '@alt-javascript/common';
import ValueResolvingConfig from './ValueResolvingConfig.js';
import DelegatingResolver from './DelegatingResolver.js';
import PlaceHolderResolver from './PlaceHolderResolver.js';
import PlaceHolderSelector from './PlaceHolderSelector.js';
import JasyptDecryptor from './JasyptDecryptor.js';
import ParenthesisSelector from './ParenthesisSelector.js';
import PrefixSelector from './PrefixSelector.js';
import URLResolver from './URLResolver.js';
import ProfileConfigLoader from './ProfileConfigLoader.js';

export default class ConfigFactory {
  static detectFetch(fetchArg) {
    let $fetch = null;
    if (!(typeof fetch === 'undefined')) {
      // eslint-disable-next-line no-undef
      $fetch = fetch;
    }
    if (getGlobalRoot('fetch')) {
      $fetch = getGlobalRoot('fetch');
    }
    $fetch = fetchArg || $fetch;
    return $fetch;
  }

  static getConfig(config, resolver, fetchArg) {
    const placeHolderResolver = new PlaceHolderResolver(new PlaceHolderSelector());
    const jasyptDecryptor = new JasyptDecryptor(new PrefixSelector('enc.'));
    const jasyptDecryptorAlt = new JasyptDecryptor(new ParenthesisSelector('ENC'));
    const urlResolver = new URLResolver(new PrefixSelector('url.'), ConfigFactory.detectFetch(fetchArg));
    const urlResolverAlt = new URLResolver(new PrefixSelector('URL'), ConfigFactory.detectFetch(fetchArg));
    const urlResolverAlt2 = new URLResolver(new PrefixSelector('FETCH'), ConfigFactory.detectFetch(fetchArg));
    const delegatingResolver = new DelegatingResolver(
      [placeHolderResolver,
        jasyptDecryptor, jasyptDecryptorAlt,
        urlResolver, urlResolverAlt, urlResolverAlt2],
    );
    const valueResolvingConfig = new ValueResolvingConfig(config || npmconfig,
      resolver || delegatingResolver);

    placeHolderResolver.reference = valueResolvingConfig;
    return valueResolvingConfig;
  }

  /**
   * Load config using Spring-aligned profile-aware property sources.
   *
   * Uses NODE_ACTIVE_PROFILES, file-based config (JSON/YAML/properties),
   * process.env with relaxed binding, and layered precedence.
   *
   * Returns a PropertySourceChain with the same has()/get() contract.
   *
   * @param {object} [options] - see ProfileConfigLoader.load() for options
   * @returns {PropertySourceChain}
   */
  static loadConfig(options = {}) {
    return ProfileConfigLoader.load(options);
  }
}
