export default class Component {
    constructor(options) {
        this.Reference = options?.Reference || (options.factory || options.wireFactory ? null : options );
        this.name = options?.name;
        this.qualifier = options?.qualifier;
        this.scope = options?.scope;
        this.properties = options?.properties;
        this.profiles = options?.profiles;
        this.factory = options?.factory;
        this.factoryFunction = options?.factoryFunction;
        this.factoryArgs = options?.factoryArgs;
        this.wireFactory = options?.wireFactory;
        this.isActive = true;
        this.instance = null;

        this.isClass = false;
        this.require = null;
    }
}
