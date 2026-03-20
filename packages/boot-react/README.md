# @alt-javascript/boot-react

[![Language](https://img.shields.io/badge/language-JavaScript-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![npm version](https://img.shields.io/npm/v/%40alt-javascript%2Fboot-react)](https://www.npmjs.com/package/@alt-javascript/boot-react)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml/badge.svg)](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml)

React integration for the `@alt-javascript` framework. CDI services accessible via React Context and hooks.

**Part of the [@alt-javascript](https://github.com/alt-javascript/boot) monorepo.**

## Install

```bash
npm install @alt-javascript/boot-react
```

## Usage

### Boot CDI and create hooks

```javascript
// boot.js
import { bootCdi } from '@alt-javascript/boot-react';

export const { CdiProvider, useCdi, useBean } = await bootCdi({
  contexts: [context],
  config,
  React,
});
```

### Wrap your app

```jsx
import { CdiProvider } from './boot';

function App() {
  return (
    <CdiProvider>
      <TodoList />
    </CdiProvider>
  );
}
```

### Use CDI beans in components

```jsx
import { useBean } from './boot';

function TodoList() {
  const todoService = useBean('todoService');
  const [todos, setTodos] = useState(todoService.list());
  // ...
}
```

### Headless mode (testing / SSR)

```javascript
import { bootCdiHeadless } from '@alt-javascript/boot-react';

const ctx = await bootCdiHeadless({ contexts, config });
const svc = ctx.get('todoService');
```

This package does not depend on React at runtime — it creates React-bound utilities when React is available, and falls back to headless mode when it's not.

## License

MIT
