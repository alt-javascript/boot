# Browser Usage

This page covers how to use `@alt-javascript` in the browser without a build step.
There are two approaches:

- **CDN (no-install)** — load pre-built ESM bundles from jsDelivr. Ideal for quick prototyping,
  static pages, and no-build web apps. Requires only a `<script type="module">` tag.
- **Local install with import map** — install packages via npm and point the browser at the
  source files. Suitable when you control the server and want local caching.

## CDN Usage (Recommended for no-build apps)

Every package in the `@alt-javascript/common`, `@alt-javascript/config`,
`@alt-javascript/logger`, `@alt-javascript/cdi`, and `@alt-javascript/boot` chain publishes a
pre-built ESM bundle to npm. jsDelivr serves these directly.

### Minimal example

Load config, the CDI container, and boot from the CDN. No npm, no bundler, no build step.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My App</title>
</head>
<body>
  <script type="importmap">
  {
    "imports": {
      "lodash": "https://cdn.jsdelivr.net/npm/lodash-es/lodash.min.js",
      "@alt-javascript/common": "https://cdn.jsdelivr.net/npm/@alt-javascript/common@3/dist/alt-javascript-common-esm.js",
      "@alt-javascript/config": "https://cdn.jsdelivr.net/npm/@alt-javascript/config@3/dist/alt-javascript-config-esm.js",
      "@alt-javascript/logger": "https://cdn.jsdelivr.net/npm/@alt-javascript/logger@3/dist/alt-javascript-logger-esm.js",
      "@alt-javascript/cdi":    "https://cdn.jsdelivr.net/npm/@alt-javascript/cdi@3/dist/alt-javascript-cdi-esm.js",
      "@alt-javascript/boot":   "https://cdn.jsdelivr.net/npm/@alt-javascript/boot@3/dist/alt-javascript-boot-esm.js"
    }
  }
  </script>

  <script type="module">
    import { Boot } from '@alt-javascript/boot';
    import { ApplicationContext, Context, Singleton } from '@alt-javascript/cdi';
    import { EphemeralConfig } from '@alt-javascript/config';

    class GreetingService {
      greet(name) { return `Hello, ${name}!`; }
    }

    const config = new EphemeralConfig({
      logging: { level: { ROOT: 'info' } },
    });

    // Boot.boot() populates the global root with config, loggerFactory, and
    // loggerCategoryCache so CDI beans can autowire loggers without boilerplate.
    Boot.boot({ config });

    const context = new Context([new Singleton(GreetingService)]);
    const appCtx = new ApplicationContext({ contexts: [context], config });
    await appCtx.start();

    const svc = appCtx.get('greetingService');
    console.log(svc.greet('world')); // Hello, world!
  </script>
</body>
</html>
```

### Why call `Boot.boot()` before `ApplicationContext`?

`Boot.boot()` populates a global root context with the resolved config, logger factory, and
logger category cache. `ApplicationContext` picks these up automatically when it starts,
allowing beans that declare a `logger` property to receive an injected logger without any
explicit wiring. Skipping `Boot.boot()` means the global root is empty and logger injection
silently fails.

### Passing config to `Boot.boot()`

`Boot.boot({ config })` accepts any object that implements `has(path)` and `get(path)` —
`EphemeralConfig`, `ProfileAwareConfig`, `ValueResolvingConfig`, or any custom implementation.
Plain POJOs are wrapped automatically. You do not need to pre-wrap your config.

```javascript
// All of these work:
Boot.boot({ config: new EphemeralConfig({ logging: { level: { ROOT: 'info' } } }) });
Boot.boot({ config: new ProfileAwareConfig(configObject, profiles) });
Boot.boot({ config: { logging: { level: { ROOT: 'info' } } } }); // plain object, auto-wrapped
```

### CDN bundle URLs

| Package | ESM bundle URL |
|---|---|
| `@alt-javascript/common` | `https://cdn.jsdelivr.net/npm/@alt-javascript/common@3/dist/alt-javascript-common-esm.js` |
| `@alt-javascript/config` | `https://cdn.jsdelivr.net/npm/@alt-javascript/config@3/dist/alt-javascript-config-esm.js` |
| `@alt-javascript/logger` | `https://cdn.jsdelivr.net/npm/@alt-javascript/logger@3/dist/alt-javascript-logger-esm.js` |
| `@alt-javascript/cdi` | `https://cdn.jsdelivr.net/npm/@alt-javascript/cdi@3/dist/alt-javascript-cdi-esm.js` |
| `@alt-javascript/boot` | `https://cdn.jsdelivr.net/npm/@alt-javascript/boot@3/dist/alt-javascript-boot-esm.js` |

The `@3` tag resolves to the latest `3.x` release. To pin to an exact version, replace `@3`
with `@3.0.4`.

### Import map requirements

The import map must appear **before** any `<script type="module">` that uses the mapped
specifiers. Browsers process the import map synchronously before evaluating modules.

The CDN bundles already rewrite their internal cross-package imports to CDN URLs — you do not
need to include `lodash` in your import map unless your own code imports it directly.

### Browser compatibility

Import maps are supported in all modern browsers (Chrome 89+, Firefox 108+, Safari 16.4+).
For older browsers, use the [es-module-shims](https://github.com/guybedford/es-module-shims)
polyfill:

```html
<script async src="https://ga.jspm.io/npm:es-module-shims@1/dist/es-module-shims.js"></script>
<script type="importmap">{ ... }</script>
```

---

## Local Install with Import Map

Install packages via npm and serve from a local directory. Use this approach when you control
the server and want to avoid CDN dependency.

```bash
npm install @alt-javascript/boot @alt-javascript/cdi @alt-javascript/config \
            @alt-javascript/logger @alt-javascript/common lodash-es
```

```html
<script type="importmap">
{
  "imports": {
    "lodash":                   "./node_modules/lodash-es/lodash.js",
    "@alt-javascript/common":   "./node_modules/@alt-javascript/common/index.js",
    "@alt-javascript/config":   "./node_modules/@alt-javascript/config/browser/index.js",
    "@alt-javascript/logger":   "./node_modules/@alt-javascript/logger/index.js",
    "@alt-javascript/cdi":      "./node_modules/@alt-javascript/cdi/index.js",
    "@alt-javascript/boot":     "./node_modules/@alt-javascript/boot/index-browser.js"
  }
}
</script>
```

> **Note:** `node_modules` must be accessible to the browser. This works with `npx serve .`
> or any static file server. It does not work by opening the HTML file directly with
> `file://` (CORS restrictions block module resolution).

---

## Browser-Specific Modules

Several packages ship source-level browser variants that avoid Node.js-specific APIs:

| Node module | Browser variant | What changes |
|---|---|---|
| `Boot.js` | `Boot-browser.js` | Uses `window` instead of `globalThis` |
| `Application.js` | `Application-browser.js` | Static import of `ApplicationContext` |
| `ConfigFactory.js` | `browser/ConfigFactory.js` | No `node-config` dependency |
| `config/index.js` | `config/browser/index.js` | Browser-safe config exports only |

The CDN bundles and the `index-browser.js` entry points wire these automatically.
You do not need to reference these files directly.

---

## Browser Profiles

Use `BrowserProfileResolver` to select configuration based on the current URL,
giving you the same profile-aware config that the server gets from `NODE_ACTIVE_PROFILES`.

```javascript
import { BrowserProfileResolver, ProfileAwareConfig, EphemeralConfig } from '@alt-javascript/config';

const configObject = {
  api: { url: 'https://api.example.com' },
  logging: { level: { ROOT: 'warn' } },
  profiles: {
    urls: {
      'localhost:8080': 'dev',
      'staging.example.com': 'staging',
      '*.example.com': 'prod',
    },
    dev: {
      api: { url: 'http://localhost:8081' },
      logging: { level: { ROOT: 'debug' } },
    },
  },
};

const profiles = BrowserProfileResolver.resolve({
  urlMappings: configObject.profiles.urls,
});
const config = new ProfileAwareConfig(configObject, profiles);

// Pass ProfileAwareConfig directly to Boot.boot() — no wrapping required.
Boot.boot({ config });

config.get('api.url');
// On localhost:8080 → 'http://localhost:8081'
// On app.example.com → 'https://api.example.com'
```

`Boot.boot()` accepts `ProfileAwareConfig` directly. Duck-typing is used to detect the config
interface — any object with `has()` and `get()` passes through without being re-wrapped.

For the full profile matching rules and `conditionalOnProfile` usage in browser components,
see [Frontend Integration](frontend-integration.md#browser-profiles).

---

## Startup Banner

When `ApplicationContext.start()` runs, it prints a startup banner — the same behaviour as
Spring Boot. The banner is controlled by the `boot.banner-mode` config key:

| Value | Behaviour |
|---|---|
| `console` | Print to `console.log` on startup. **Default.** |
| `log` | Route through the configured `@alt-javascript/logger` at `info` level. |
| `off` | Suppress the banner entirely. |

### Banner in the browser

The banner works in the browser. The version line shows `(browser)` instead of the package
version number, because `package.json` is not accessible from browser JavaScript.

```javascript
const config = new EphemeralConfig({ logging: { level: { ROOT: 'info' } } });
Boot.boot({ config });
const appCtx = new ApplicationContext({ contexts: [context], config });
await appCtx.start();
// Browser console output:
//   ____        _ _        _                                _       _    ____
//  / / /   __ _| | |_     (_) __ ___   ____ _ ___  ___ _ __(_)_ __ | |_  \ \ \
// ...
// @alt-javascript/boot :: (browser)
```

### Suppress the banner

```javascript
const config = new EphemeralConfig({
  boot: { 'banner-mode': 'off' },
  logging: { level: { ROOT: 'info' } },
});
```

### Route the banner through the logger

Set `boot.banner-mode` to `log` to send the banner through the configured logger at `info`
level instead of writing directly to `console.log`. Useful when you want the banner captured
by your logging infrastructure:

```javascript
const config = new EphemeralConfig({
  boot: { 'banner-mode': 'log' },
  logging: { level: { ROOT: 'info' } },
});
```

### Banner in Node.js

On Node.js the version line is resolved at runtime from `package.json` — no hardcoded string.
The version shown always matches the installed package version.

```
  ____        _ _        _                                _       _    ____
 / / /   __ _| | |_     (_) __ ___   ____ _ ___  ___ _ __(_)_ __ | |_  \ \ \
...
@alt-javascript/boot :: 3.0.4
```

### Test environments

`Boot.test()` automatically sets `banner-mode: off` via a config overlay on the global root.
Any `ApplicationContext` that does not explicitly set `boot.banner-mode` in its own config
inherits `off` during test runs. You do not need to configure this in individual test fixtures.

---

## Frontend Framework Integration

CDI services integrate with all major frontend frameworks via thin adapter packages:

| Framework | Package | Integration mechanism |
|---|---|---|
| Vue 3 | [`@alt-javascript/boot-vue`](frontend-integration.md#vue-3) | `provide` / `inject` |
| Alpine.js | [`@alt-javascript/boot-alpine`](frontend-integration.md#alpinejs) | `Alpine.store` |
| React | [`@alt-javascript/boot-react`](frontend-integration.md#react) | Context / hooks (`CdiProvider`, `useCdi`, `useBean`) |
| Angular | [`@alt-javascript/boot-angular`](frontend-integration.md#angular) | Angular providers |

Each adapter supports both CDN usage (no build step) and CLI/bundler usage.
See [Frontend Integration](frontend-integration.md) for examples of each.

---

## Limitations in the Browser

| Feature | Status | Alternative |
|---|---|---|
| `ProfileConfigLoader` (reads `*.yaml`/`*.properties` from disk) | Not available | `EphemeralConfig`, `ProfileAwareConfig`, or `window.config` |
| `WinstonLogger` / `WinstonLoggerFactory` | Not available | `ConsoleLogger` (default) |
| `process.env` | Not available | `window.config` or `BrowserProfileResolver` URL mapping |
| Auto-discovery (`AutoDiscovery.scan`) | Not available | Register components explicitly in `new Context([...])` |
| `PropertiesParser` | Available — but you must fetch the file content yourself | `fetch('/app.properties').then(r => r.text())` |
| Banner version number | Shows `(browser)` — `package.json` is not accessible from browser JS | Use `boot.banner-mode: off` or `log` if version is important |
