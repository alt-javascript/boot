const Salty = require('../decorators/Salty');

module.exports = new class Cake {
    static is = Salty();
    constructor(origin){
        this.origin = origin;
    }
}