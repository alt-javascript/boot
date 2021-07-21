const {ValueResolvingConfig,EphemeralConfig,ConfigFactory} = require ('@alt-javascript/config');
const {LoggerCategoryCache,LoggerFactory,ConfigurableLogger} = require('@alt-javascript/logger');

module.exports = function (context) {

    let configArg = context?.config;
    let loggerFactoryArg = context?.loggerFactory;
    let loggerCategoryCacheArg = context?.loggerFactory;

    let browser = !(typeof window == 'undefined');

    let _config = null;
    if (!(typeof config == 'undefined')){
        _config = config;
    }
    if (browser && window?.config){
        _config = window.config;
    }

    _config = configArg || _config;

    if (_config){
        if (!(_config instanceof ValueResolvingConfig) && (_config.constructor?.name !== 'ValueResolvingConfig')){
            if (browser){
                _config = ConfigFactory.getConfig(new EphemeralConfig(_config));
            } else {
                _config = ConfigFactory.getConfig(_config);
            }
         }
    } else {
        throw new Error ('Unable to detect config, is \'config\' declared or provided?');
    }

    let _loggerCategoryCache = null;
    if (!(typeof loggerCategoryCacheArg == 'undefined')){
        _loggerCategoryCache = loggerCategoryCacheArg;
    }
    if (browser && window?.loggerCategoryCache){
        _config = window.loggerCategoryCache;
    }

    _loggerCategoryCache = _loggerCategoryCache || loggerCategoryCacheArg || new LoggerCategoryCache();

    let _loggerFactory = null;
    if (!(typeof loggerFactory == 'undefined')){
        _loggerFactory = loggerFactory;
    }
    _loggerFactory = _loggerFactory || loggerFactoryArg || new LoggerFactory(_config,_loggerCategoryCache,ConfigurableLogger.DEFAULT_CONFIG_PATH);

    let _globalref = null;
    if (browser){
        _globalref = window;
    } else {
        _globalref = global;
    }
    _globalref.boot = {contexts: {root:{config:_config}}};
    _globalref.boot.contexts.root.loggerCategoryCache = _loggerCategoryCache;
    _globalref.boot.contexts.root.loggerFactory = _loggerFactory;

}
