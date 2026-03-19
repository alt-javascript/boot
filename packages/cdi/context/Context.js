/* eslint-disable import/extensions */
import _ from 'lodash';
export default class Context {
    constructor(components,profile) {
        this.components = (components || []) ;
        this.components = (_.isArray(this.components) ? this.components : [this.components]) ;
        this.profile = profile;
    }
}
