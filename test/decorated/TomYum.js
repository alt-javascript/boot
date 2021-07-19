const Sour = require('../decorators/Sour');
const Spicy = require('../decorators/Spicy');

module.exports = new class TomYum {
    static with = ['Sweet',Sour(),Spicy];

    constructor(origin){
        this.origin = origin;
    }
}