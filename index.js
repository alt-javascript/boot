const Application = require('./Application');
const Boot = require('./Boot');
const { config } = require ('@alt-javascript/config');

module.exports.Application = Application;
module.exports.Boot = Boot;
module.exports.boot = Boot.boot;
module.exports.root = Boot.root;
module.exports.test = Boot.test;
module.exports.config = config;
