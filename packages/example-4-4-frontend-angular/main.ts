/**
 * example-4-4-frontend-angular — application entry point
 *
 * angularStarter() boots CDI via Boot.boot(), then bootstrapApplication()
 * mounts the Angular standalone root component with CDI beans as providers.
 *
 * URL → profile resolution is automatic: Boot.boot() reads profiles.urls
 * from the config POJO and resolves the active profile from window.location.
 *
 *   localhost:5175   → dev   (green badge)
 *   127.0.0.1:5175   → local (blue badge)
 */
import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { angularStarter } from '@alt-javascript/boot-angular';
import { Context, Singleton } from '@alt-javascript/cdi';
import { AppComponent } from './src/app.component';
import { TodoService } from './src/services.js';

const { providers } = await angularStarter({
  contexts: [new Context([new Singleton(TodoService)])],
  config: {
    boot: { 'banner-mode': 'log' },
    app: {
      name: 'Angular Todo',
      version: '1.0.0',
      env: 'default',
    },
    logging: { level: { ROOT: 'info' } },
    profiles: {
      urls: {
        'localhost:5175':  'dev',
        '127.0.0.1:5175': 'local',
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
});

bootstrapApplication(AppComponent, { providers });
