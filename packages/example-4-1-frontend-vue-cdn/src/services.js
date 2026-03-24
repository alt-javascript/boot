/**
 * example-4-1-frontend-vue-cdn — CDI service layer
 *
 * Same CDI bean pattern — works in both Node (tests) and browser (Vue CDN).
 * No Vue imports here; this is pure business logic.
 */

export class TodoService {
  static qualifier = '@alt-javascript/example-4-1-frontend-vue-cdn/TodoService';

  constructor() {
    this.logger = null;
    this.config = null;
    this._todos = [];
    this._nextId = 1;
  }

  init() {
    this.logger.info('TodoService ready');
    // Seed with a couple of items so the demo has something to show
    this.add('Learn @alt-javascript/boot');
    this.add('Build a Vue CDN app with CDI');
  }

  add(title) {
    const todo = { id: this._nextId++, title, done: false };
    this._todos.push(todo);
    this.logger.debug(`Added todo #${todo.id}: ${title}`);
    return todo;
  }

  toggle(id) {
    const todo = this._todos.find((t) => t.id === id);
    if (todo) todo.done = !todo.done;
    return todo;
  }

  remove(id) {
    const idx = this._todos.findIndex((t) => t.id === id);
    if (idx !== -1) this._todos.splice(idx, 1);
  }

  getAll() {
    return [...this._todos];
  }
}
