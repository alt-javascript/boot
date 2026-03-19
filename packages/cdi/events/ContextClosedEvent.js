import ApplicationEvent from './ApplicationEvent.js';

/** Published when the ApplicationContext is being closed/destroyed. */
export default class ContextClosedEvent extends ApplicationEvent {
  constructor(source) {
    super(source);
    this.type = 'ContextClosedEvent';
  }
}
