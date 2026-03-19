/* eslint-disable import/extensions */
import Component from './Component.js';
import Scopes from './Scopes.js';

export default class Prototype extends Component {
  constructor(optionsArg) {
    const options = (optionsArg?.Reference
            || optionsArg.factory
            || optionsArg.wireFactory) ? optionsArg : { Reference: optionsArg };
    options.scope = Scopes.PROTOTYPE;
    super(options);
  }
}
