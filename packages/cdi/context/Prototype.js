/* eslint-disable import/extensions */
import Component from './Component.js';
import Scopes from './Scopes.js';

/** Prototype-scoped component — new instance on each get() call. */
export default class Prototype extends Component {
  constructor(optionsArg) {
    const options = (optionsArg?.Reference
            || optionsArg.factory
            || optionsArg.wireFactory) ? optionsArg : { Reference: optionsArg };
    options.scope = Scopes.PROTOTYPE;
    super(options);
  }
}
