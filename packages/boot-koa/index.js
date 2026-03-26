/**
 * @alt-javascript/boot-koa — Koa adapter for the alt-javascript framework.
 *
 * Provides CDI-managed Koa server with controller auto-registration.
 *
 * Usage:
 *   import { koaStarter } from '@alt-javascript/boot-koa';
 *   const context = new Context([...koaStarter(), ...yourComponents]);
 */
import {
  RequestLoggerMiddleware,
  ErrorHandlerMiddleware,
  NotFoundMiddleware,
} from '@alt-javascript/boot';
import KoaAdapter from './KoaAdapter.js';
import KoaControllerRegistrar from './KoaControllerRegistrar.js';

/**
 * Returns CDI component definitions that auto-configure Koa.
 *
 * Registers:
 * - `koaAdapter` — CDI-managed Koa server with lifecycle hooks
 * - `requestLoggerMiddleware` — per-request logging (order: 10)
 * - `errorHandlerMiddleware` — exception → structured response (order: 20)
 * - `notFoundMiddleware` — null route result → 404 (order: 30)
 *
 * @returns {Array} component definitions for CDI Context
 */
export function koaStarter() {
  return [
    {
      name: 'koaAdapter',
      Reference: KoaAdapter,
      scope: 'singleton',
      condition: (config, components) => !components.koaAdapter,
    },
    {
      name: 'requestLoggerMiddleware',
      Reference: RequestLoggerMiddleware,
      scope: 'singleton',
      condition: (config, components) => !components.requestLoggerMiddleware,
    },
    {
      name: 'errorHandlerMiddleware',
      Reference: ErrorHandlerMiddleware,
      scope: 'singleton',
      condition: (config, components) => !components.errorHandlerMiddleware,
    },
    {
      name: 'notFoundMiddleware',
      Reference: NotFoundMiddleware,
      scope: 'singleton',
      condition: (config, components) => !components.notFoundMiddleware,
    },
  ];
}

export { KoaAdapter, KoaControllerRegistrar };

/** @deprecated Use koaStarter() */
export const koaAutoConfiguration = koaStarter;
