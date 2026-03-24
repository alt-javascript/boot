/**
 * services.spec.js — unit tests for the CDI service layer
 *
 * Tests run in Node without Angular. CDI wired manually with EphemeralConfig.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { EphemeralConfig } from '@alt-javascript/config';
import { ApplicationContext, Context, Singleton } from '@alt-javascript/cdi';
import { TodoService } from '../src/services.js';

const config = new EphemeralConfig({
  'logging.test.fixtures.quiet': true,
  app: { name: 'test' },
  logging: { level: { ROOT: 'error' } },
});

async function makeContext() {
  const ctx = new ApplicationContext({
    contexts: [new Context([new Singleton(TodoService)])],
    config,
  });
  await ctx.start({ run: false });
  return ctx;
}

describe('TodoService', () => {
  let svc;

  beforeEach(async () => {
    const ctx = await makeContext();
    svc = ctx.get('todoService');
  });

  it('seeds two items on init', () => {
    expect(svc.getAll()).toHaveLength(2);
  });

  it('adds a new item', () => {
    svc.add('Third task');
    expect(svc.getAll()).toHaveLength(3);
    expect(svc.getAll()[2].title).toBe('Third task');
  });

  it('toggles done state', () => {
    const [first] = svc.getAll();
    expect(first.done).toBe(false);
    svc.toggle(first.id);
    expect(svc.getAll()[0].done).toBe(true);
  });

  it('removes an item', () => {
    const [first] = svc.getAll();
    svc.remove(first.id);
    expect(svc.getAll()).toHaveLength(1);
    expect(svc.getAll()[0].title).not.toBe(first.title);
  });

  it('getAll returns a copy', () => {
    const todos = svc.getAll();
    todos.push({ id: 99, title: 'ghost', done: false });
    expect(svc.getAll()).toHaveLength(2);
  });
});
