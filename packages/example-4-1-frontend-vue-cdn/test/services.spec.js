/**
 * example-4-1-frontend-vue-cdn — service tests
 *
 * Tests the CDI service layer in Node — no Vue, no browser required.
 * The service is framework-agnostic; Vue only uses it via inject().
 */
import { assert } from 'chai';
import { Boot } from '@alt-javascript/boot';
import { Context, Singleton } from '@alt-javascript/cdi';
import { TodoService } from '../src/services.js';

let todoService;

before(async () => {
  const context = new Context([new Singleton(TodoService)]);
  const appCtx = await Boot.boot({ contexts: [context], run: false });
  todoService = appCtx.get('todoService');
});

describe('TodoService (CDI bean)', () => {
  it('init seeds two todos', () => {
    const todos = todoService.getAll();
    assert.equal(todos.length, 2);
    assert.equal(todos[0].title, 'Learn @alt-javascript/boot');
    assert.equal(todos[1].title, 'Build a Vue CDN app with CDI');
  });

  it('add() creates a new todo', () => {
    const todo = todoService.add('Test CDI in Vue');
    assert.equal(todo.id, 3);
    assert.equal(todo.title, 'Test CDI in Vue');
    assert.equal(todo.done, false);
    assert.equal(todoService.getAll().length, 3);
  });

  it('toggle() flips done state', () => {
    todoService.toggle(1);
    assert.equal(todoService.getAll()[0].done, true);
    todoService.toggle(1);
    assert.equal(todoService.getAll()[0].done, false);
  });

  it('remove() deletes a todo', () => {
    todoService.remove(3);
    assert.equal(todoService.getAll().length, 2);
  });

  it('getAll() returns a copy (not internal ref)', () => {
    const a = todoService.getAll();
    const b = todoService.getAll();
    assert.notStrictEqual(a, b);
  });
});
