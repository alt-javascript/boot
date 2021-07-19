const Sweet = require('../decorators/Sweet');

module.exports = new class Cake {
    static is = Sweet();
    constructor(origin){
        this.origin = origin;
    }
}