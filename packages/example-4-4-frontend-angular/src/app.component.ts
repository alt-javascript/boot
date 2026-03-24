/**
 * app.component.ts — Angular standalone root component
 *
 * CDI beans are injected via Angular's inject() function using the string
 * tokens registered by angularStarter(). All business logic lives in
 * the CDI TodoService; Angular manages only the UI layer.
 *
 * Profile info is read from applicationContext.config — Boot.boot() resolved
 * the active profile from window.location via profiles.urls.
 */
import { Component, signal, inject, OnInit } from '@angular/core';
import { NgFor, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgFor, NgClass, FormsModule],
  styles: [`
    :host { display: block; font-family: system-ui, sans-serif; max-width: 640px; margin: 2rem auto; padding: 0 1rem; }
    .title-row { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.25rem; }
    h1 { font-size: 1.4rem; margin: 0; }
    .profile-badge {
      display: inline-block; padding: 0.15rem 0.5rem; border-radius: 3px;
      font-size: 0.75rem; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;
    }
    .dev   { background: #e8f5e9; color: #2e7d32; border: 1px solid #a5d6a7; }
    .local { background: #e3f2fd; color: #1565c0; border: 1px solid #90caf9; }
    .default { background: #f5f5f5; color: #555; border: 1px solid #ccc; }
    .subtitle { color: #666; font-size: 0.9rem; margin-bottom: 1.5rem; }
    .input-row { display: flex; gap: 0.4rem; }
    input[type=text] { flex: 1; padding: 0.4rem 0.6rem; font-size: 1rem; border: 1px solid #ccc; border-radius: 4px; }
    button { padding: 0.4rem 0.8rem; font-size: 1rem; cursor: pointer; border-radius: 4px; border: 1px solid #bbb; background: #fff; }
    button.primary { background: #dd0031; color: white; border-color: #dd0031; font-weight: 600; }
    ul { list-style: none; padding: 0; margin-top: 1rem; }
    li { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0; border-bottom: 1px solid #eee; }
    li span { flex: 1; }
    .done span { text-decoration: line-through; color: #aaa; }
    .banner { font-size: 0.75rem; color: #999; margin-top: 2rem; }
  `],
  template: `
    <div class="title-row">
      <h1>@alt-javascript/boot — Angular</h1>
      <span class="profile-badge" [ngClass]="activeProfile">{{ activeProfile }}</span>
    </div>

    <p class="subtitle">
      Profile: <strong>{{ activeProfile }}</strong> · env: <em>{{ appEnv }}</em> ·
      profile resolved automatically by <code>Boot.boot()</code>
    </p>

    <div class="input-row">
      <input
        type="text"
        [(ngModel)]="newTitle"
        placeholder="New todo…"
        (keyup.enter)="addTodo()"
      />
      <button class="primary" (click)="addTodo()">Add</button>
    </div>

    <ul>
      <li *ngFor="let todo of todos()" [ngClass]="{ done: todo.done }">
        <input type="checkbox" [checked]="todo.done" (change)="toggleTodo(todo.id)" />
        <span>{{ todo.title }}</span>
        <button (click)="removeTodo(todo.id)">✕</button>
      </li>
    </ul>

    <p class="banner">Powered by @alt-javascript/boot · CDI via @alt-javascript/cdi</p>
  `,
})
export class AppComponent implements OnInit {
  private readonly appCtx  = inject<any>('applicationContext' as any);
  private readonly todoSvc = inject<any>('todoService' as any);

  activeProfile = 'default';
  appEnv        = 'default';
  newTitle      = '';
  todos         = signal<any[]>([]);

  ngOnInit() {
    this.activeProfile = (this.appCtx.config?.activeProfiles?.[0]) || 'default';
    this.appEnv        = this.appCtx.config?.get?.('app.env', 'default') || 'default';
    this.todos.set(this.todoSvc.getAll());
  }

  addTodo() {
    if (!this.newTitle.trim()) return;
    this.todoSvc.add(this.newTitle.trim());
    this.todos.set(this.todoSvc.getAll());
    this.newTitle = '';
  }

  toggleTodo(id: number) {
    this.todoSvc.toggle(id);
    this.todos.set(this.todoSvc.getAll());
  }

  removeTodo(id: number) {
    this.todoSvc.remove(id);
    this.todos.set(this.todoSvc.getAll());
  }
}
