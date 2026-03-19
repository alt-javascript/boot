/* eslint-disable import/extensions */
import Component from './Component.js';
import Scopes from './Scopes.js';

/** Service component — singleton-scoped, semantic alias for application services. */
export default class Service extends Component {
    constructor(optionsArg) {
        let options = (optionsArg?.Reference
            || optionsArg.factory
            || optionsArg.wireFactory) ? optionsArg : {Reference: optionsArg};
        options.scope = Scopes.SINGLETON;
        super (options);
    }
}
