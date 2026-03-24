<script setup>
/**
 * App.vue — root component
 *
 * CDI beans and profile info are injected via Vue's inject().
 * vueStarter() provides CDI singletons; main.js provides activeProfile + appEnv.
 */
import { inject, ref } from 'vue';

const todoService   = inject('todoService');
const activeProfile = inject('activeProfile', 'default');
const appEnv        = inject('appEnv', 'default');

const todos    = ref(todoService.getAll());
const newTitle = ref('');

function addTodo() {
  if (!newTitle.value.trim()) return;
  todoService.add(newTitle.value.trim());
  todos.value = todoService.getAll();
  newTitle.value = '';
}
function toggleTodo(id) {
  todoService.toggle(id);
  todos.value = todoService.getAll();
}
function removeTodo(id) {
  todoService.remove(id);
  todos.value = todoService.getAll();
}
</script>

<template>
  <div class="app">
    <div class="title-row">
      <h1>@alt-javascript/boot — Vue (Vite)</h1>
      <span class="profile-badge" :class="activeProfile">{{ activeProfile }}</span>
    </div>
    <p class="subtitle">
      Profile: <strong>{{ activeProfile }}</strong> · env: <em>{{ appEnv }}</em> ·
      <code>inject('todoService')</code> + <code>BrowserProfileResolver</code>
    </p>

    <div class="input-row">
      <input
        v-model="newTitle"
        type="text"
        placeholder="New todo…"
        @keyup.enter="addTodo"
      />
      <button class="primary" @click="addTodo">Add</button>
    </div>

    <ul class="todo-list">
      <li v-for="todo in todos" :key="todo.id" :class="{ done: todo.done }">
        <input type="checkbox" :checked="todo.done" @change="toggleTodo(todo.id)" />
        <span>{{ todo.title }}</span>
        <button @click="removeTodo(todo.id)">✕</button>
      </li>
    </ul>

    <p class="banner">Powered by @alt-javascript/boot · CDI via @alt-javascript/cdi</p>
  </div>
</template>

<style scoped>
.app { font-family: system-ui, sans-serif; max-width: 640px; margin: 2rem auto; padding: 0 1rem; }
.title-row { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.25rem; }
h1 { font-size: 1.4rem; margin: 0; }
.profile-badge {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 3px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}
.profile-badge.dev     { background: #e8f5e9; color: #2e7d32; border: 1px solid #a5d6a7; }
.profile-badge.local   { background: #e3f2fd; color: #1565c0; border: 1px solid #90caf9; }
.profile-badge.default { background: #f5f5f5; color: #555;    border: 1px solid #ccc; }
.subtitle { color: #666; font-size: 0.9rem; margin-bottom: 1.5rem; }
.input-row { display: flex; gap: 0.4rem; }
input[type=text] {
  flex: 1;
  padding: 0.4rem 0.6rem;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}
button { padding: 0.4rem 0.8rem; font-size: 1rem; cursor: pointer; border-radius: 4px; border: 1px solid #bbb; }
button.primary { background: #42b883; color: white; border-color: #42b883; }
.todo-list { list-style: none; padding: 0; margin-top: 1rem; }
.todo-list li { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0; border-bottom: 1px solid #eee; }
.todo-list li span { flex: 1; }
.todo-list li.done span { text-decoration: line-through; color: #aaa; }
.banner { font-size: 0.75rem; color: #999; margin-top: 2rem; }
</style>
