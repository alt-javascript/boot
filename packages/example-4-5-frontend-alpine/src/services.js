/**
 * TodoService — CDI-managed service layer.
 *
 * Pure JavaScript; no Alpine dependency. All business logic here;
 * Alpine components call these methods via $store.cdi.todoService.
 */
export class TodoService {
  constructor() {
    this.logger = null;   // CDI injects logger
    this.config = null;   // CDI injects config
    this._items = [];
    this._nextId = 1;
  }

  init() {
    const name = this.config?.get('app.name', 'Alpine Todo');
    this.logger?.info(`TodoService ready (app: ${name})`);
    // Seed two todos so the list isn't empty on first load
    this.add('Learn @alt-javascript/boot');
    this.add('Build an Alpine.js app with CDI');
  }

  getAll() {
    return [...this._items];
  }

  add(title) {
    this._items.push({ id: this._nextId++, title, done: false });
    this.logger?.debug(`TodoService.add: "${title}"`);
  }

  toggle(id) {
    const item = this._items.find(t => t.id === id);
    if (item) item.done = !item.done;
  }

  remove(id) {
    this._items = this._items.filter(t => t.id !== id);
  }
}
