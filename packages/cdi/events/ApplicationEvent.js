/**
 * Base class for application events.
 *
 * All application events carry a source (the object that published the event)
 * and a timestamp. Subclass for specific event types.
 */
export default class ApplicationEvent {
  constructor(source) {
    this.source = source;
    this.timestamp = new Date();
  }
}
