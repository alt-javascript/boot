/* eslint-disable import/extensions */
import Component from './Component.js';
import Scopes from './Scopes.js';

export default class Transient extends Component {
    constructor(optionsArg) {
        let options = (optionsArg?.Reference
            || optionsArg.factory
            || optionsArg.wireFactory) ? optionsArg : {Reference: optionsArg};
        options.scope = Scopes.PROTOTYPE;
        super (options);
    }
}
