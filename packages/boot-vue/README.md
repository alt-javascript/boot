# @alt-javascript/boot-vue

[![Language](https://img.shields.io/badge/language-JavaScript-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![npm version](https://img.shields.io/npm/v/%40alt-javascript%2Fboot-vue)](https://www.npmjs.com/package/@alt-javascript/boot-vue)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml/badge.svg)](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml)

Vue 3 integration for the `@alt-javascript` framework. Bridges CDI-managed services into Vue's reactive system via `provide`/`inject`.

**Part of the [@alt-javascript](https://github.com/alt-javascript/boot) monorepo.**

## Install

```bash
npm install @alt-javascript/boot-vue
```

## CDN Usage (no build step)

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

## Vite / CLI Usage

```javascript
import { createApp } from 'vue';
import { cdiPlugin } from '@alt-javascript/boot-vue';
import App from './App.vue';

const app = createApp(App);
app.use(cdiPlugin, { contexts: [context], config });
app.mount('#app');
```

## In Components

```javascript
import { inject } from 'vue';

const todoService = inject('todoService');
const ctx = inject('applicationContext');
```

All CDI singletons are provided by name. The full `ApplicationContext` is available as `'applicationContext'` or `'ctx'`.

## License

MIT
