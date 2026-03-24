/**
 * App.jsx — root component
 *
 * CDI beans accessed via useCdi() / useBean() hooks from the module-level
 * CdiContext, which is populated by CdiProvider in main.jsx.
 *
 * Profile info is read from appCtx.config — Boot.boot() has already resolved
 * the active profile from window.location via profiles.urls mapping.
 */
import React, { useState } from 'react';
import './index.css';
import { useCdi } from './cdi-context.js';

export default function App() {
  const appCtx      = useCdi();
  const todoService = appCtx.get('todoService');

  const activeProfile = (appCtx.config?.activeProfiles?.[0]) || 'default';
  const appEnv        = appCtx.config?.get?.('app.env', 'default') || 'default';

  const [todos,    setTodos]    = useState(() => todoService.getAll());
  const [newTitle, setNewTitle] = useState('');

  function addTodo() {
    if (!newTitle.trim()) return;
    todoService.add(newTitle.trim());
    setTodos(todoService.getAll());
    setNewTitle('');
  }

  function toggleTodo(id) {
    todoService.toggle(id);
    setTodos(todoService.getAll());
  }

  function removeTodo(id) {
    todoService.remove(id);
    setTodos(todoService.getAll());
  }

  return (
    <div className="app">
      <div className="title-row">
        <h1>@alt-javascript/boot — React</h1>
        <span className={`profile-badge ${activeProfile}`}>{activeProfile}</span>
      </div>

      <p className="subtitle">
        Profile: <strong>{activeProfile}</strong> · env: <em>{appEnv}</em> ·{' '}
        profile resolved automatically by <code>Boot.boot()</code>
      </p>

      <div className="input-row">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyUp={(e) => e.key === 'Enter' && addTodo()}
          placeholder="New todo…"
        />
        <button className="primary" onClick={addTodo}>Add</button>
      </div>

      <ul className="todo-list">
        {todos.map((todo) => (
          <li key={todo.id} className={todo.done ? 'done' : ''}>
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() => toggleTodo(todo.id)}
            />
            <span>{todo.title}</span>
            <button onClick={() => removeTodo(todo.id)}>✕</button>
          </li>
        ))}
      </ul>

      <p className="banner">
        Powered by @alt-javascript/boot · CDI via @alt-javascript/cdi
      </p>
    </div>
  );
}
