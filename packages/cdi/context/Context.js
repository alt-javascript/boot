/* eslint-disable import/extensions */
import _ from 'lodash';

/**
 * A named collection of component definitions.
 * Passed to ApplicationContext to define the beans in the context.
 *
 * @example
 * const ctx = new Context([new Singleton(MyService), new Singleton(MyRepo)]);
 */
export default class Context {
    constructor(components,profile) {
        this.components = (components || []) ;
        this.components = (_.isArray(this.components) ? this.components : [this.components]) ;
        this.profile = profile;
    }
}
