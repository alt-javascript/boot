# @alt-javascript/boot-alpine

[![Language](https://img.shields.io/badge/language-JavaScript-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![npm version](https://img.shields.io/npm/v/%40alt-javascript%2Fboot-alpine)](https://www.npmjs.com/package/@alt-javascript/boot-alpine)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml/badge.svg)](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml)

Alpine.js integration for the `@alt-javascript` framework. CDI-managed services accessible from Alpine components via `$store.cdi`.

**Part of the [@alt-javascript](https://github.com/alt-javascript/boot) monorepo.**

## Install

```bash
npm install @alt-javascript/boot-alpine
```

## Usage

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

All CDI singletons are registered on `Alpine.store('cdi')`. The `ApplicationContext` is available as `$store.cdi.ctx`.

## Custom Store Name

```javascript
await bootAlpine({ contexts, config, Alpine, storeName: 'services' });
// Access as $store.services.todoService
```

## License

MIT
