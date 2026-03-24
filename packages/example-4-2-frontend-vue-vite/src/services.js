/**
 * example-4-2-frontend-vue-vite — CDI service layer
 *
 * Pure business logic — no Vue imports.
 * CDI autowires logger and config via property injection.
 * Works identically in Node (Vitest) and browser (Vite dev server).
 */

export class TodoService {
  static qualifier = '@alt-javascript/example-4-2-frontend-vue-vite/TodoService';

  constructor() {
    /** @type {import('@alt-javascript/logger').Logger} */
    this.logger = null;
    /** @type {import('@alt-javascript/config').ValueResolvingConfig} */
    this.config = null;
    this._todos = [];
    this._nextId = 1;
  }

  init() {
    const appName = this.config.get('app.name', 'Vue Vite Todo');
    this.logger.info(`TodoService ready (app: ${appName})`);
    this.add('Learn @alt-javascript/boot');
    this.add('Build a Vue Vite app with CDI');
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
