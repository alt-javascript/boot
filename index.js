const config = require('config');
const boot = require('./boot');

boot(config);
console.log(`${global.boot.some}`);
console.log(`${typeof window == 'undefined'}`)
