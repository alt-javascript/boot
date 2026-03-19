/* eslint-disable import/extensions */
import _ from 'lodash';
import { LoggerFactory } from '@alt-javascript/logger';
import { ConfigFactory } from '@alt-javascript/config';
import { getGlobalRoot } from '@alt-javascript/common';
import {
  Context, Component, Property, Scopes,
} from './context/index.js';
import BeanPostProcessor from './BeanPostProcessor.js';
import ApplicationEventPublisher from './events/ApplicationEventPublisher.js';
import ContextRefreshedEvent from './events/ContextRefreshedEvent.js';
import ContextClosedEvent from './events/ContextClosedEvent.js';

export default class ApplicationContext {
  // eslint-disable-next-line
  static DEFAULT_CONTEXT_NAME = 'default';

  static DEFAULT_CONFIG_CONTEXT_PATH = 'context';

  constructor(options) {
    const contexts = options?.contexts || options;
    if (Array.isArray(contexts)) {
      this.contexts = contexts;
    } else {
      this.contexts = (contexts ? [contexts] : []);
    }
    this.components = {};
    this.profiles = options?.profiles;
    this.name = options?.name || ApplicationContext.DEFAULT_CONTEXT_NAME;
    this.configContextPath = options?.configContextPath
        || (typeof (process) !== 'undefined' && process?.env?.NODE_CONFIG_CONTEXT_PATH)
        || ApplicationContext.DEFAULT_CONFIG_CONTEXT_PATH;
    this.config = options?.config || ConfigFactory.getConfig({});
    if (options?.config) {
      // eslint-disable-next-line no-param-reassign
      delete options.config;
    }
    if (options?.profiles) {
      // eslint-disable-next-line no-param-reassign
      delete options.profiles;
    }
    if (options?.configContextPath) {
      // eslint-disable-next-line no-param-reassign
      delete options.configContextPath;
    }
    this.logger = LoggerFactory.getLogger('@alt-javascript/cdi/ApplicationContext', this.config);
  }

  async start(options) {
    this.logger.verbose('Application context starting.');
    await this.lifeCycle(options);
    this.logger.verbose('Application context started.');
  }

  async lifeCycle(options) {
    this.logger.verbose(`ApplicationContext (${this.name}) lifecycle started.`);
    await this.prepare();
    return this.run(options);
  }

  async prepare() {
    this.logger.verbose(`ApplicationContext (${this.name}) lifecycle prepare phase started.`);
    await this.parseContexts();
    this.registerEventPublisher();
    this.createSingletons();
    this.injectSingletonDependencies();
    this.detectBeanPostProcessors();
    this.postProcessBeforeInitialization();
    this.detectEventListeners();
    this.initialiseSingletons();
    this.postProcessAfterInitialization();
    this.registerSingletonDestroyers();
    this.publishContextRefreshedEvent();
    this.logger.verbose(`ApplicationContext (${this.name}) lifecycle prepare phase completed.`);
  }

  detectConfigContext() {
    this.logger.verbose('Detecting config contexts started.');
    if (this.config) {
      if (this.config.has(this.configContextPath)) {
        this.logger.verbose(`Detected config context at ${this.configContextPath}, adding context.`);
        this.contexts.push(this.config.get(this.configContextPath));
      }
    }
    this.logger.verbose('Detecting config contexts completed.');
  }

  detectGlobalContextComponents() {
    this.logger.verbose('Detecting global context components started.');

    if (!this.components.config && getGlobalRoot('config')) {
      this.deriveContextComponent({
        Reference: getGlobalRoot('config'),
        name: 'config',
      });
    }
    if (!this.components.loggerFactory && getGlobalRoot('loggerFactory')) {
      this.deriveContextComponent({
        Reference: getGlobalRoot('loggerFactory'),
        name: 'loggerFactory',
      });
    }
    if (!this.components.loggerCategoryCache && getGlobalRoot('loggerCategoryCache')) {
      this.deriveContextComponent({
        Reference: getGlobalRoot('loggerCategoryCache'),
        name: 'loggerCategoryCache',
      });
    }
    if (!this.components.logger) {
      this.deriveContextComponent({
        scope: Scopes.PROTOTYPE,
        wireFactory: 'loggerFactory',
        factoryFunction: 'getLogger',
        name: 'logger',
      });
    }
    if (!this.components.fetch && getGlobalRoot('fetch')) {
      this.deriveContextComponent({
        Reference: getGlobalRoot('fetch'),
        name: 'fetch',
      });
    }

    this.logger.verbose('Detecting global context components completed.');
  }

  async parseContexts() {
    this.logger.verbose('Parsing configured contexts started.');
    this.detectConfigContext();
    for (let i = 0; i < this.contexts.length; i++) {
      if (this.contexts[i]) {
        if (this.contexts[i]?.constructor?.name === 'Context') {
          // eslint-disable-next-line no-await-in-loop
          await this.parseContextComponents(this.contexts[i]);
        } else {
          // eslint-disable-next-line no-await-in-loop
          await this.parseContextComponents(new Context(this.contexts[i]));
        }
      } else {
        const msg = `ApplicationContext (${this.name}) received a nullish context.`;
        this.logger.error(msg);
        throw new Error(msg);
      }
    }
    this.detectGlobalContextComponents();
    this.logger.verbose('Parsing configured contexts completed.');
  }

  async deriveContextComponent(contextComponent) {
    if (contextComponent.name || contextComponent.Reference || contextComponent.factory) {
      await this.parseContextComponent(contextComponent);
    } else {
      const contextKeys = Object.keys(contextComponent);
      for (let i = 0; i < contextKeys.length; i++) {
        const name = contextKeys[i];
        const component = contextComponent[name];
        component.name = name;
        // eslint-disable-next-line no-await-in-loop
        await this.parseContextComponent(component);
      }
    }
  }

  async parseContextComponents(context) {
    this.logger.verbose('Processing context components started');
    if (context.components) {
      if (Array.isArray(context.components)) {
        for (let i = 0; i < context.components.length; i++) {
          // eslint-disable-next-line no-await-in-loop
          await this.deriveContextComponent(context.components[i]);
        }
      }
    }
    this.logger.verbose('Processing context components completed');
  }

  async parseContextComponent(componentArg) {
    let component = componentArg;
    if (component?.constructor?.name !== 'Component'
        && component?.constructor?.name !== 'Singleton'
        && component?.constructor?.name !== 'Prototype') {
      component = new Component(
        component, component.name,
        component.qualifier,
        component.scope,
        component.properties, component.profiles,
      );
      component.require = componentArg.require;
    }
    const constructr = component?.Reference?.prototype?.constructor;
    const $component = {};
    $component.isClass = constructr !== undefined;

    $component.name = _.lowerFirst(component.name) || _.lowerFirst(constructr.name);
    $component.qualifier = component.qualifier || _.lowerFirst(constructr?.qualifier);
    $component.scope = component.scope || _.lowerFirst(constructr?.scope) || Scopes.SINGLETON;
    $component.Reference = component.Reference;
    $component.factory = component.factory;
    $component.factoryFunction = component.factoryFunction;
    $component.factoryArgs = component.factoryArgs;
    $component.wireFactory = component.wireFactory;
    $component.constructorArgs = componentArg.constructorArgs || component.constructorArgs;
    // TODO - dynamic import (async)
    if (component.require) {
      try {
      // eslint-disable-next-line
        let module = await import(component.require);
        $component.Reference = module.default;
        $component.isClass = ($component?.Reference?.prototype?.constructor !== undefined);
      } catch (err) {
        this.logger.error(err);
      }
    }

    $component.properties = component.properties || constructr?.properties;
    $component.profiles = component.profiles || constructr?.profiles;
    if (!$component.profiles) {
      $component.profiles = [];
    }
    if (typeof $component.profiles === 'string') {
      $component.profiles = $component.profiles.split(',');
    }
    $component.isActive = $component.profiles.length === 0;

    const activeProfiles = this.profiles?.split(',') || [];
    if (activeProfiles.length > 0 && !$component.isActive) {
      $component.isActive = _.intersection(activeProfiles, $component.profiles).length > 0;
      if ($component.isActive === false) {
        let negations = _.filter($component.profiles, (profile) => profile.startsWith('!'));
        negations = _.map(negations, (profile) => profile.substring(1));
        $component.isActive = negations.length > 0
            && _.intersection(activeProfiles, negations).length === 0;
      }
    }

    if ($component.isActive) {
      // Evaluate condition if present (from componentArg, e.g. conditionalOnProperty)
      const condition = componentArg.condition;
      if (condition && typeof condition === 'function') {
        const conditionResult = condition(this.config, this.components);
        if (!conditionResult) {
          this.logger.verbose(`Condition failed for component (${$component.name}), skipping registration`);
          return;
        }
        this.logger.verbose(`Condition passed for component (${$component.name})`);
      }

      if (!this.components[$component.name]) {
        this.components[$component.name] = $component;
        this.logger.verbose(`Added application context component (${$component.name}) with ${$component.scope} scope`);
      } else {
        const msg = `Duplicate definition of application context component (${$component.name})`;
        this.logger.error(msg);
        throw new Error(msg);
      }
    } else {
      this.logger.verbose(`Skipped inactive application context component (${$component.name}), with scope ${$component.scope}`);
    }
  }

  createSingletons() {
    this.logger.verbose('Creating singletons started');
    const keys = Object.keys(this.components);
    for (let i = 0; i < keys.length; i++) {
      const component = this.components[keys[i]];
      if (component.scope === Scopes.SINGLETON && !component.instance) {
        if (component.isClass) {
          if (component.constructorArgs && Array.isArray(component.constructorArgs)) {
            const resolvedArgs = component.constructorArgs.map((arg) => {
              if (typeof arg === 'string' && this.components[arg]) {
                return this.get(arg);
              }
              return arg;
            });
            component.instance = new component.Reference(...resolvedArgs);
            this.logger.verbose(`Created singleton (${component.name}) with constructor args [${component.constructorArgs.join(', ')}]`);
          } else {
            component.instance = new component.Reference();
          }
        } else if (typeof component.factory === 'function') {
          let args = component.factoryArgs;
          if (!Array.isArray(args)) {
            args = [args];
          }
          // eslint-disable-next-line new-cap
          component.instance = new component.factory(...args);
        } else {
          component.instance = component.Reference;
        }
        this.logger.verbose(`Created singleton (${component.name})`);
      }
    }
    this.logger.verbose('Creating singletons completed');
  }

  resolveConfigPlaceHolder(placeholderArg) {
    const placeholder = placeholderArg.substring(2, placeholderArg.length - 1);
    const tuple = placeholder.split(':');
    const path = tuple[0];
    const defaultValue = tuple[1] || undefined;
    let returnValue = null;
    try {
      returnValue = this.config.get(path, defaultValue ? JSON.parse(defaultValue) : defaultValue);
    } catch (e) {
      const msg = `Failed to resolve placeholder component property value (${path}) from config.`;
      this.logger.error(msg);
      throw new Error(msg);
    }
    return returnValue;
  }

  autowireComponentDependencies(instance, component) {
    const insKeys = Object.keys(instance);
    for (let j = 0; j < insKeys.length; j++) {
      const property = instance[insKeys[j]];
      const autowire = property?.name === 'Autowired'
          || (typeof property === 'string' && _.lowerCase(property)) === 'autowired';
      if (autowire) {
        // eslint-disable-next-line no-param-reassign
        instance[insKeys[j]] = this.get(insKeys[j], undefined, component);
        this.logger.verbose(`Explicitly autowired component (${component.name}) property (${insKeys[j]}) from context.`);
      } else if (instance[insKeys[j]] == null) {
        // eslint-disable-next-line no-param-reassign
        instance[insKeys[j]] = this.get(insKeys[j], (instance[insKeys[j]] || null), component);
        if (instance[insKeys[j]] != null) {
          this.logger.verbose(`Implicitly autowired null component (${component.name}) property (${insKeys[j]}) from context.`);
        }
      } else if (typeof instance[insKeys[j]] === 'string' && instance[insKeys[j]].startsWith('${')) {
        try {
          // eslint-disable-next-line no-param-reassign
          instance[insKeys[j]] = this.resolveConfigPlaceHolder(instance[insKeys[j]]);
        } catch (e) {
          const msg = `Failed to explicitly autowired placeholder component (${component.name}) property value (${insKeys[j]}) from config.`;
          this.logger.error(msg);
          throw new Error(msg);
        }
        this.logger.verbose(`Explicitly autowired placeholder component (${component.name}) property value (${insKeys[j]}) from config.`);
      }
    }
  }

  wireComponentProperty(component, propertyArg) {
    let property = propertyArg;
    if (propertyArg?.constructor?.name !== 'Property') {
      property = new Property();
      property.name = propertyArg.name;
      property.reference = propertyArg?.reference;
      property.value = propertyArg?.value;
      property.path = propertyArg?.path;
      property.defaultValue = propertyArg?.defaultValue;
      property.factory = propertyArg?.factory;
      property.function = propertyArg?.function;
      property.args = propertyArg?.args;
    }
    if (typeof property.name === 'string') {
      if (property.reference) {
        // eslint-disable-next-line no-param-reassign
        component.instance[property.name] = this.get(property.reference, undefined, component);
        this.logger.verbose(`Explicitly wired component (${component.name}) property (${property.name}) with context reference (${property.reference}).`);
      }
      if (property.value) {
        // eslint-disable-next-line no-param-reassign
        component.instance[property.name] = property.value;
        this.logger.verbose(`Explicitly wired component (${component.name}) property (${property.name}) with value (${property.value}).`);
      }
      if (property.path) {
        // eslint-disable-next-line no-param-reassign
        component.instance[property.name] = this.config.get(property.path, property.defaultValue);
        this.logger.verbose(`Explicitly wired component (${component.name}) property (${property.name}) from config path (${property.path}).`);
      }
    }
  }

  wireComponentDependencies(component) {
    if (component.properties) {
      if (!Array.isArray(component.properties)) {
        // eslint-disable-next-line no-param-reassign
        component.properties = [component.properties];
      }
      for (let i = 0; i < component.properties.length; i++) {
        this.wireComponentProperty(component, component.properties[i]);
      }
    }
  }

  injectSingletonDependencies() {
    this.logger.verbose('Injecting singletons dependencies started');
    const keys = Object.keys(this.components);
    for (let i = 0; i < keys.length; i++) {
      const component = this.components[keys[i]];
      if (component.scope === Scopes.SINGLETON) {
        this.autowireComponentDependencies(component.instance, component);
        this.wireComponentDependencies(component);
      }
    }
    this.logger.verbose('Injecting singleton dependencies completed');
  }

  initialiseSingletons() {
    this.logger.verbose('Initialising singletons started');
    const keys = Object.keys(this.components);
    for (let i = 0; i < keys.length; i++) {
      const component = this.components[keys[i]];
      if (component.scope === Scopes.SINGLETON) {
        // Aware interface: inject ApplicationContext reference
        if (typeof component.instance?.setApplicationContext === 'function') {
          component.instance.setApplicationContext(this);
          this.logger.verbose(`Called setApplicationContext on singleton (${component.name})`);
        }

        if (typeof component.instance.init === 'function') {
          component.instance.init();
        } else if (typeof component.init === 'string') {
          component.instance[component.init]();
        }
        this.logger.verbose(`Initialised singleton (${component.name})`);
      }
    }
    this.logger.verbose('Initialising singletons completed');
  }

  static registerDestroyer(destroyer) {
    if (typeof (process) !== 'undefined' && destroyer) {
      // process.on('exit', destroyer?.bind());
      // catches ctrl+c event
      process.on('SIGINT', destroyer?.bind());
      // catches "kill pid" (for example: nodemon restart)
      process.on('SIGUSR1', destroyer?.bind());
      process.on('SIGUSR2', destroyer?.bind());
      // catches uncaught exceptions
      process.on('uncaughtException', destroyer?.bind());
    }
  }

  async registerSingletonDestroyers() {
    this.logger.verbose('Registering singleton destroyers started');
    const keys = Object.keys(this.components);
    for (let i = 0; i < keys.length; i++) {
      const component = this.components[keys[i]];
      if (component.scope === Scopes.SINGLETON) {
        let destroyer = null;
        if (typeof component.instance.destroy === 'function') {
          destroyer = () => component.instance.destroy(component.instance);
        } else if (typeof component.destroy === 'string') {
          destroyer = () => component.instance[component.destroy](component.instance);
        }
        ApplicationContext.registerDestroyer(destroyer);
        this.logger.verbose(`Registering singleton (${component.name}) destroyer`);
      }
    }
    // Register context shutdown: publish ContextClosedEvent, then log completion
    ApplicationContext.registerDestroyer(() => {
      this.publishContextClosedEvent();
      this.logger.verbose(`ApplicationContext (${this.name}) lifecycle completed.`);
    });
    this.logger.verbose('Registering singleton destroyers completed');
  }

  /**
   * Auto-register ApplicationEventPublisher as a context-managed singleton
   * if not already provided by user configuration.
   */
  registerEventPublisher() {
    if (!this.components.applicationEventPublisher) {
      this.eventPublisher = new ApplicationEventPublisher();
      this.components.applicationEventPublisher = {
        name: 'applicationEventPublisher',
        scope: Scopes.SINGLETON,
        isClass: false,
        instance: this.eventPublisher,
        properties: [],
        profiles: [],
        isActive: true,
      };
      this.logger.verbose('Registered applicationEventPublisher as context singleton');
    } else {
      this.eventPublisher = this.components.applicationEventPublisher.instance;
    }
  }

  /**
   * Find all singleton components whose instances are BeanPostProcessors.
   * Stores them in order for lifecycle hook invocation.
   */
  detectBeanPostProcessors() {
    this.beanPostProcessors = [];
    const keys = Object.keys(this.components);
    for (let i = 0; i < keys.length; i++) {
      const component = this.components[keys[i]];
      if (component.scope === Scopes.SINGLETON && component.instance instanceof BeanPostProcessor) {
        this.beanPostProcessors.push(component);
        this.logger.verbose(`Detected BeanPostProcessor (${component.name})`);
      }
    }
  }

  /**
   * Call postProcessBeforeInitialization on all BeanPostProcessors for each
   * singleton (except BeanPostProcessors themselves — they're already initialized).
   */
  postProcessBeforeInitialization() {
    if (this.beanPostProcessors.length === 0) return;
    this.logger.verbose('Post-process before initialization started');
    const keys = Object.keys(this.components);
    for (let i = 0; i < keys.length; i++) {
      const component = this.components[keys[i]];
      if (component.scope === Scopes.SINGLETON && !(component.instance instanceof BeanPostProcessor)) {
        for (let j = 0; j < this.beanPostProcessors.length; j++) {
          const bpp = this.beanPostProcessors[j];
          const result = bpp.instance.postProcessBeforeInitialization(component.instance, component.name);
          if (result !== undefined && result !== null) {
            component.instance = result;
          }
          this.logger.verbose(`BeanPostProcessor (${bpp.name}) postProcessBeforeInitialization called for (${component.name})`);
        }
      }
    }
    this.logger.verbose('Post-process before initialization completed');
  }

  /**
   * Call postProcessAfterInitialization on all BeanPostProcessors for each
   * singleton (except BeanPostProcessors themselves).
   */
  postProcessAfterInitialization() {
    if (this.beanPostProcessors.length === 0) return;
    this.logger.verbose('Post-process after initialization started');
    const keys = Object.keys(this.components);
    for (let i = 0; i < keys.length; i++) {
      const component = this.components[keys[i]];
      if (component.scope === Scopes.SINGLETON && !(component.instance instanceof BeanPostProcessor)) {
        for (let j = 0; j < this.beanPostProcessors.length; j++) {
          const bpp = this.beanPostProcessors[j];
          const result = bpp.instance.postProcessAfterInitialization(component.instance, component.name);
          if (result !== undefined && result !== null) {
            component.instance = result;
          }
          this.logger.verbose(`BeanPostProcessor (${bpp.name}) postProcessAfterInitialization called for (${component.name})`);
        }
      }
    }
    this.logger.verbose('Post-process after initialization completed');
  }

  /**
   * Detect singletons with an onApplicationEvent method and subscribe them
   * to all events via the event publisher.
   */
  detectEventListeners() {
    if (!this.eventPublisher) return;
    this.logger.verbose('Detecting event listeners started');
    const keys = Object.keys(this.components);
    for (let i = 0; i < keys.length; i++) {
      const component = this.components[keys[i]];
      if (component.scope === Scopes.SINGLETON
          && component.instance
          && typeof component.instance.onApplicationEvent === 'function') {
        this.eventPublisher.on('*', (event) => component.instance.onApplicationEvent(event));
        this.logger.verbose(`Registered event listener (${component.name}) via onApplicationEvent convention`);
      }
    }
    this.logger.verbose('Detecting event listeners completed');
  }

  /**
   * Publish ContextRefreshedEvent after prepare() completes.
   */
  publishContextRefreshedEvent() {
    if (!this.eventPublisher) return;
    const event = new ContextRefreshedEvent(this);
    this.eventPublisher.publish(event);
    this.logger.verbose(`Published ContextRefreshedEvent for ApplicationContext (${this.name})`);
  }

  /**
   * Publish ContextClosedEvent during shutdown.
   */
  publishContextClosedEvent() {
    if (!this.eventPublisher) return;
    const event = new ContextClosedEvent(this);
    this.eventPublisher.publish(event);
    this.logger.verbose(`Published ContextClosedEvent for ApplicationContext (${this.name})`);
  }

  async run(options) {
    if (!(options) || options?.run) {
      this.logger.verbose(`ApplicationContext (${this.name}) lifecycle run phase started.`);

      const keys = Object.keys(this.components);
      for (let i = 0; i < keys.length; i++) {
        const component = this.components[keys[i]];
        if (component.scope === Scopes.SINGLETON) {
          if (typeof component.run === 'string') {
            component.instance[component.run]();
          } else if (typeof component.instance.run === 'function') {
            component.instance.run();
          }
        }

        this.logger.verbose(`ApplicationContext (${this.name}) lifecycle run phase completed.`);
      }
    } else {
      this.logger.verbose(`ApplicationContext (${this.name}) skipping lifecycle run phase.`);
    }
    this.logger.verbose(`ApplicationContext (${this.name}) lifecycle completed.`);
  }

  get(reference, defaultValue, targetArgs) {
    if (this.components[reference]) {
      this.logger.verbose(`Found component (${reference})`);
      if (this.components[reference].scope === Scopes.SINGLETON) {
        this.logger.verbose(`Component (${reference}) is scoped as (${Scopes.SINGLETON}), returning existing instance.`);
        return this.components[reference].instance;
      }
      let prototype = null;
      if (this.components[reference].isClass) {
        this.logger.verbose(`Component (${reference}) is scoped as (${Scopes.PROTOTYPE}), returning new instance.`);
        prototype = new this.components[reference].Reference();
      } else if (typeof this.components[reference].Reference === 'function') {
        let args = targetArgs || this.components[reference].factoryArgs;
        if (!Array.isArray(args)) {
          args = [args];
        }
        prototype = this.components[reference].Reference(...args);
      } else if (typeof this.components[reference].factory === 'function') {
        let args = this.components[reference].factoryArgs;
        if (!Array.isArray(args)) {
          args = [args];
        }
        prototype = this.components[reference].factory(...args);
      } else if (typeof this.components[reference].factory === 'string' && typeof this.components[reference].factoryFunction === 'string') {
        let args = this.components[reference].factoryArgs;
        if (!Array.isArray(args)) {
          args = [args];
        }
        prototype = this.get(
          this.components[reference].factory,
        )[this.components[reference].factoryFunction](...args);
      } else if (typeof this.components[reference].wireFactory === 'function') {
        let args = targetArgs;
        if (!Array.isArray(args)) {
          args = [args];
        }
        prototype = this.components[reference].wireFactory(...args);
      } else if (typeof this.components[reference].wireFactory === 'string' && typeof this.components[reference].factoryFunction === 'string') {
        let args = targetArgs;
        if (!Array.isArray(args)) {
          args = [args];
        }
        const factory = this.get(this.components[reference].wireFactory);
        prototype = factory[this.components[reference].factoryFunction](...args);
      } else {
        this.logger.verbose(`Component (${reference}) is scoped as (${Scopes.PROTOTYPE}), returning deep clone.`);
        prototype = _.cloneDeep(this.components[reference].Reference);
      }
      this.autowireComponentDependencies(prototype, this.components[reference]);
      return prototype;
    }
    if (typeof defaultValue === 'undefined') {
      const msg = `Failed component reference lookup for (${reference})`;
      this.logger.error(msg);
      throw new Error(msg);
    }
    return defaultValue;
  }
}
