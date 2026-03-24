/**
 * example-4-3-frontend-react — application entry point
 *
 * Boot CDI via Boot.boot(), then mount the React root wrapped in CdiProvider.
 *
 * URL → profile resolution is automatic: Boot.boot() reads profiles.urls
 * from the config POJO and resolves the active profile from window.location.
 * No manual BrowserProfileResolver / ProfileAwareConfig wiring needed.
 *
 *   localhost:5174   → dev   (green badge)
 *   127.0.0.1:5174   → local (blue badge)
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Boot } from '@alt-javascript/boot';
import { Context, Singleton } from '@alt-javascript/cdi';
import App from './src/App.jsx';
import { CdiProvider } from './src/cdi-context.js';
import { TodoService } from './src/services.js';

const appCtx = await Boot.boot({
  contexts: [new Context([new Singleton(TodoService)])],
  config: {
    boot: { 'banner-mode': 'log' },
    app: {
      name: import.meta.env.VITE_APP_NAME || 'React Todo',
      version: '1.0.0',
      env: 'default',
    },
    logging: { level: { ROOT: 'info' } },
    profiles: {
      urls: {
        'localhost:5174':  'dev',
        '127.0.0.1:5174': 'local',
      },
      dev: {
        app: { env: 'development (localhost)' },
        logging: { level: { ROOT: 'debug' } },
      },
      local: {
        app: { env: 'local (127.0.0.1)' },
        logging: { level: { ROOT: 'debug' } },
      },
    },
  },
  run: false,
});

createRoot(document.getElementById('root')).render(
  React.createElement(CdiProvider, { appCtx },
    React.createElement(App),
  ),
);
