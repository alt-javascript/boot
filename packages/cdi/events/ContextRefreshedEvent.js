import ApplicationEvent from './ApplicationEvent.js';

/** Published when the ApplicationContext has been fully initialized. */
export default class ContextRefreshedEvent extends ApplicationEvent {
  constructor(source) {
    super(source);
    this.type = 'ContextRefreshedEvent';
  }
}
