An Extensible Config & Logging Application Bootstrap Function
=============================================================

[![NPM](https://nodei.co/npm/@alt-javascript/boot.svg?downloads=true&downloadRank=true)](https://nodei.co/npm/@alt-javascript/boot/)
<br/>
![Language Badge](https://img.shields.io/github/languages/top/craigparra/alt-boot)
![Package Badge](https://img.shields.io/npm/v/@alt-javascript/boot) <br/>
[release notes](https://github.com/craigparra/alt-boot/blob/main/History.md)

<a name="intro">Introduction</a>
--------------------------------
An opinionated application config and logging bootstrap that streamlines the use of the
- [@alt-javascript/config](https://www.npmjs.com/package/@alt-javascript/config), and
-  [@alt-javascript/logger](https://www.npmjs.com/package/@alt-javascript/logger)


The boot function binds a global root context with configured LoggerFactory 
to negate the need for requiring  and injecting the application config in every module.
   
<a name="usage">Usage</a>
-------------------------

To use the module, simply import the substituted package as you would with the popular
[config](https://www.npmjs.com/package/config) package

```javascript
const config = require('@alt-javascript/config');
const {LoggerFactory} = require('@alt-javascript/logger');
const {boot} = require('@alt-javascript/boot');

boot(config);

config.get('key');
config.get('nested.key');
config.get('unknown','use this instead'); // this does not throw an error

const logger = LoggerFactory.getLogger('@myorg/mypackage/MyModule');
logger.info('Hello World!')
```

To boot and use [winston](https://www.npmjs.com/package/winston) as the logging transport, 
boot a WinstonLoggerFactory instead.

`MyApp.js`
```javascript
const config = require('@alt-javascript/config');
const winston = require('winston');
const {LoggerFactory, WinstonLoggerFactory} = require('@alt-javascript/logger');
const {boot} = require('@alt-javascript/boot');
const winstonLoggerFactory = new WinstonLoggerFactory(config,winston,{/*my winston options*/})
boot(config, winstonLoggerFactory);
```

The in your application modules, you only need.

`MyModule.js`
```javascript
const {LoggerFactory} = require('@alt-javascript/logger');

// LoggerFactory.getLogger will now bind to the global root context loggerFactory, 
// configured with booted winstonLoggerFactory from MyApp.js.

const logger = LoggerFactory.getLogger('@myorg/mypackage/MyModule');
logger.info('Hello from MyModule!')
```

`MyOtherModule.js`
```javascript
const {LoggerFactory} = require('@alt-javascript/logger');

// Shared logging config, different file.

const logger = LoggerFactory.getLogger('@myorg/mypackage/MyOtherModule');
logger.info('Hello from MyOtherModule!')
```
<a name="license">License</a>
-----------------------------

May be freely distributed under the [MIT license](https://raw.githubusercontent.com/craigparra/alt-logger/master/LICENSE).

Copyright (c) 2021 Craig Parravicini    
