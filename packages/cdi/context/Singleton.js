/* eslint-disable import/extensions */
import Component from './Component.js';
import Scopes from './Scopes.js';

/** Singleton-scoped component — one shared instance per ApplicationContext. */
export default class Singleton extends Component {
    constructor(optionsArg) {
        let options = (optionsArg?.Reference
            || optionsArg.factory
            || optionsArg.wireFactory) ? optionsArg : {Reference: optionsArg};
        options.scope = Scopes.SINGLETON;
        super (options);
    }
}
