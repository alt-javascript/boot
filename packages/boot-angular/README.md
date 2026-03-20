# @alt-javascript/boot-angular

[![Language](https://img.shields.io/badge/language-JavaScript-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![npm version](https://img.shields.io/npm/v/%40alt-javascript%2Fboot-angular)](https://www.npmjs.com/package/@alt-javascript/boot-angular)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml/badge.svg)](https://github.com/alt-javascript/boot/actions/workflows/node.js.yml)

Angular integration for the `@alt-javascript` framework. CDI beans registered as Angular injection tokens.

**Part of the [@alt-javascript](https://github.com/alt-javascript/boot) monorepo.**

## Install

```bash
npm install @alt-javascript/boot-angular
```

## Usage

### Create Angular providers from CDI

```javascript
import { createCdiProviders } from '@alt-javascript/boot-angular';

const { providers } = await createCdiProviders({ contexts: [context], config });

bootstrapApplication(AppComponent, { providers: [...providers] });
```

### Inject CDI beans in components

```typescript
@Component({ ... })
export class TodoComponent {
  constructor(@Inject('todoService') private todoService: any) {}
}
```

### Dynamic lookup via CdiService

```javascript
import { createCdiProvidersWithService } from '@alt-javascript/boot-angular';

const { providers } = await createCdiProvidersWithService({ contexts, config });
// Inject 'cdiService' and call cdiService.getBean('todoService')
```

Each CDI singleton is registered as a `{ provide: name, useValue: instance }` — standard Angular value providers. The full `ApplicationContext` is available via `@Inject('applicationContext')`.

This package does not depend on Angular at runtime.

## License

MIT
