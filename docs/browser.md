# Browser Usage

## ES Module Imports

The framework works directly in the browser as ES modules — no bundler required:

```html
<script type="importmap">
{
  "imports": {
    "@alt-javascript/boot": "./node_modules/@alt-javascript/boot/index-browser.js",
    "@alt-javascript/cdi": "./dist/alt-javascript-cdi-esm.js",
    "@alt-javascript/config": "./node_modules/@alt-javascript/config/browser/index.js",
    "@alt-javascript/logger": "./node_modules/@alt-javascript/logger/index.js",
    "@alt-javascript/common": "./node_modules/@alt-javascript/common/index.js",
    "lodash": "https://cdn.jsdelivr.net/npm/lodash-es@4/lodash.js"
  }
}
</script>

<script type="module">
  import { Boot } from '@alt-javascript/boot';
  import { ApplicationContext, Context, Singleton } from '@alt-javascript/cdi';
  import { EphemeralConfig } from '@alt-javascript/config';

  // Your application code here — identical to Node.js
</script>
```

## Browser-Specific Modules

Some modules have browser variants that avoid Node.js-specific APIs:

| Module | Browser Variant | Difference |
|---|---|---|
| `Boot.js` | `Boot-browser.js` | Uses `window` instead of `global` |
| `Application.js` | `Application-browser.js` | Browser-safe imports |
| `ConfigFactory.js` | `browser/ConfigFactory.js` | No `node-config` dependency |

The `index-browser.js` entry points wire these automatically.

## CDI Browser Bundle

The CDI package includes a pre-built ESM bundle at `dist/alt-javascript-cdi-esm.js`. This single file bundles all CDI exports (ApplicationContext, Context, Singleton, events, AOP, conditions, auto-discovery) for browser use.

Build it from source:

```bash
cd packages/cdi
npm run build
```

## CDN Usage

For quick prototyping, use CDN-hosted dependencies:

```html
<script type="importmap">
{
  "imports": {
    "lodash": "https://cdn.jsdelivr.net/npm/lodash-es@4/lodash.js"
  }
}
</script>
```

## Limitations in Browser

- `ProfileConfigLoader` requires `fs` and `path` — not available in browsers. Use `EphemeralConfig`, `ProfileAwareConfig`, or `window.config` instead.
- `WinstonLogger` and `WinstonLoggerFactory` are Node.js only.
- `PropertiesParser` works in browser but you'll need to fetch the file content yourself.
- `process.env` is not available — environment-based config doesn't apply.

## Browser Profiles

Use `BrowserProfileResolver` to select configuration based on the current URL:

```javascript
import { BrowserProfileResolver, ProfileAwareConfig } from '@alt-javascript/config';

const config = {
  api: { url: 'https://api.example.com' },
  profiles: {
    urls: { 'localhost:8080': 'dev', '*.example.com': 'prod' },
    dev: { api: { url: 'http://localhost:8081' } },
  },
};

const profiles = BrowserProfileResolver.resolve({ urlMappings: config.profiles.urls });
const resolvedConfig = new ProfileAwareConfig(config, profiles);
// resolvedConfig.get('api.url') → depends on current URL
```

This replaces the v2 `WindowLocationSelectiveConfig` approach. See [Frontend Integration](frontend-integration.md) for full details.

## Frontend Framework Integration

CDI services can be bridged into frontend frameworks:

- **[Vue 3](frontend-integration.md#vue-3)** — `provide`/`inject` via `@alt-javascript/boot-vue`
- **[Alpine.js](frontend-integration.md#alpinejs)** — `Alpine.store` via `@alt-javascript/boot-alpine`
- **[React](frontend-integration.md#react)** — Context/hooks via `@alt-javascript/boot-react`
- **[Angular](frontend-integration.md#angular)** — providers via `@alt-javascript/boot-angular`
