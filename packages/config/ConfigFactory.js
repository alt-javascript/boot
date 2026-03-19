/* eslint-disable import/extensions */
import npmconfig from 'config';
import ValueResolvingConfig from './ValueResolvingConfig.js';
import DelegatingResolver from './DelegatingResolver.js';
import PlaceHolderResolver from './PlaceHolderResolver.js';
import PlaceHolderSelector from './PlaceHolderSelector.js';
import JasyptDecryptor from './JasyptDecryptor.js';
import ParenthesisSelector from './ParenthesisSelector.js';
import PrefixSelector from './PrefixSelector.js';
import URLResolver from './URLResolver.js';

export default class ConfigFactory {
  static getGlobalRef() {
    let $globalref = null;
    if (ConfigFactory.detectBrowser()) {
      $globalref = window;
    } else {
      $globalref = global;
    }
    return $globalref;
  }

  static getGlobalRoot(key) {
    const $globalref = ConfigFactory.getGlobalRef();
    let $key = ($globalref && $globalref.boot);
    $key = $key && $key.contexts;
    $key = $key && $key.root;
    $key = $key && $key[`${key}`];
    return $key;
  }

  static detectBrowser() {
    const browser = !(typeof window === 'undefined');
    return browser;
  }

  static detectFetch(fetchArg) {
    let $fetch = null;
    if (!(typeof fetch === 'undefined')) {
      // eslint-disable-next-line no-undef
      $fetch = fetch;
    }
    if (ConfigFactory.getGlobalRoot('fetch')) {
      $fetch = ConfigFactory.getGlobalRoot('fetch');
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
}
