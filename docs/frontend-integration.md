# Frontend Integration

Connect CDI-managed services to frontend frameworks. Each adapter bridges CDI singletons into the framework's native dependency mechanism.

## Browser Profiles

Before wiring CDI into a frontend framework, you need config that adapts to the deployment URL. `BrowserProfileResolver` maps URLs to profile names, and `ProfileAwareConfig` overlays profile-specific config sections.

```javascript
const configObject = {
  api: { url: 'https://api.example.com' },
  logging: { level: { '/': 'warn' } },
  profiles: {
    urls: {
      'localhost:8080': 'dev',
      'localhost:3000': 'dev',
      'staging.example.com': 'staging',
      '*.example.com': 'prod',
    },
    dev: {
      api: { url: 'http://localhost:8081' },
      logging: { level: { '/': 'debug' } },
    },
    staging: {
      api: { url: 'https://staging-api.example.com' },
    },
  },
};
```

Resolve the active profile from the current URL:

```javascript
import { BrowserProfileResolver, ProfileAwareConfig } from '@alt-javascript/config';

const profiles = BrowserProfileResolver.resolve({
  urlMappings: configObject.profiles.urls,
});
const config = new ProfileAwareConfig(configObject, profiles);

config.get('api.url');
// localhost:8080 → 'http://localhost:8081'
// app.example.com → 'https://api.example.com'
```

### Matching Rules

1. **Exact host:port** — `localhost:8080` matches `http://localhost:8080/any/path`
2. **Hostname only** — `staging.example.com` matches any port
3. **Wildcard** — `*.example.com` matches `app.example.com` but not `example.com` itself
4. **Query parameter** — `?profile=dev` overrides URL mapping
5. **Default** — falls back to `['default']` if no match

This is symmetric with server-side profiles: the same `conditionalOnProfile('dev')` works in both environments. On the server, the profile comes from `NODE_ACTIVE_PROFILES`. In the browser, it comes from the URL.

## Vue 3

```bash
npm install @alt-javascript/boot-vue
```

### CDN Usage (no build step)

```html
<script type="module">
  import { createCdiApp } from '@alt-javascript/boot-vue';

  const { vueApp } = await createCdiApp({
    contexts: [context],
    config,
    rootComponent: App,
    createApp: Vue.createApp,
  });

  vueApp.mount('#app');
</script>
```

### Vite / CLI Usage

```javascript
import { createApp } from 'vue';
import { cdiPlugin } from '@alt-javascript/boot-vue';

const app = createApp(App);
app.use(cdiPlugin, { contexts: [context], config });
app.mount('#app');
```

### In Components

```javascript
import { inject } from 'vue';

const todoService = inject('todoService');
const ctx = inject('applicationContext');
```

All CDI singletons are provided by name via Vue's `provide`/`inject`.

## Alpine.js

```bash
npm install @alt-javascript/boot-alpine
```

```html
<script type="module">
  import { bootAlpine } from '@alt-javascript/boot-alpine';
  await bootAlpine({ contexts: [context], config, Alpine: window.Alpine });
</script>
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3/dist/cdn.min.js"></script>

<div x-data>
  <p x-text="$store.cdi.greetingService.greet('World')"></p>
</div>
```

CDI singletons are registered on `Alpine.store('cdi')`.

## React

```bash
npm install @alt-javascript/boot-react
```

```javascript
import { bootCdi } from '@alt-javascript/boot-react';

// At app startup
const { CdiProvider, useBean } = await bootCdi({
  contexts: [context],
  config,
  React,
});

// Wrap your app
function App() {
  return <CdiProvider><TodoList /></CdiProvider>;
}

// In components
function TodoList() {
  const todoService = useBean('todoService');
  const [todos, setTodos] = useState(todoService.list());
}
```

Falls back to headless mode when React isn't available — useful for testing and SSR.

## Angular

```bash
npm install @alt-javascript/boot-angular
```

```javascript
import { createCdiProviders } from '@alt-javascript/boot-angular';

const { providers } = await createCdiProviders({ contexts: [context], config });
bootstrapApplication(AppComponent, { providers: [...providers] });
```

In components:

```typescript
@Component({ ... })
export class TodoComponent {
  constructor(@Inject('todoService') private todoService: any) {}
}
```

CDI beans are registered as Angular `{ provide, useValue }` providers.

## Design Principle

The frontend adapters are thin bridges. They don't re-implement Vue reactivity, React state management, or Angular DI. They connect CDI's service layer to each framework's native dependency mechanism, keeping your business logic framework-agnostic.
