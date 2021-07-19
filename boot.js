const {ValueResolvingConfig,EphemeralConfig,ConfigFactory} = require ('@alt-javascript/config');
const {LoggerRegistry,LoggerFactory} = require('@alt-javascript/logger');

module.exports = function (configArg,loggerFactoryArg,loggerRegistryArg) {

    let browser = !(typeof window == 'undefined');

    let outerConfig = null;
    if (!(typeof config == 'undefined')){
        outerConfig = config;
    }
    let _config = configArg || outerConfig;

    if (_config){
        if (_config.constructor?.name !== 'ValueResolvingConfig'){
            if (browser){
                _config = new ConfigFactory.getConfig(new EphemeralConfig(_config));
            } else {
                _config = ConfigFactory.getConfig(_config);
            }
         }
    }

    let outerLoggerRegistry = null;
    if (!(typeof loggerRegistry == 'undefined')){
        outerLoggerRegistry = loggerRegistry;
    }
    let _loggerRegistry = outerLoggerRegistry || loggerFactoryArg || new LoggerRegistry();

    let outerLoggerFactory = null;
    if (!(typeof loggerFactory == 'undefined')){
        outerLoggerFactory = loggerFactory;
    }
    let _loggerFactory = outerLoggerFactory || loggerFactoryArg || new LoggerFactory(_config,_loggerRegistry);

    let _globalref = null;
    if (browser){
        _globalref = window;
    } else {
        _globalref = global;
    }
    _globalref.boot = {contexts: {root:{config:_config}}};
    _globalref.boot.contexts.root.loggerRegistry = _loggerRegistry;
    _globalref.boot.contexts.root.loggerFactory = _loggerFactory;
    console.log(`configArg => ${configArg}`);
    console.log(`config outer scope => ${outerConfig}`);
    console.log(`config result => ${_config}`);
}
