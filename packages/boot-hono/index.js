/**
 * @alt-javascript/boot-hono — Hono adapter for the alt-javascript framework.
 *
 * Provides CDI-managed Hono server with controller auto-registration.
 *
 * Usage:
 *   import { honoStarter } from '@alt-javascript/boot-hono';
 *   const context = new Context([...honoStarter(), ...yourComponents]);
 */
import {
  RequestLoggerMiddleware,
  ErrorHandlerMiddleware,
  NotFoundMiddleware,
} from '@alt-javascript/boot';
import HonoAdapter from './HonoAdapter.js';
import HonoControllerRegistrar from './HonoControllerRegistrar.js';

/**
 * Returns CDI component definitions that auto-configure Hono.
 *
 * Registers:
 * - `honoAdapter` — CDI-managed Hono server with lifecycle hooks
 * - `requestLoggerMiddleware` — per-request logging (order: 10)
 * - `errorHandlerMiddleware` — exception → structured response (order: 20)
 * - `notFoundMiddleware` — null route result → 404 (order: 30)
 *
 * @returns {Array} component definitions for CDI Context
 */
export function honoStarter() {
  return [
    {
      name: 'honoAdapter',
      Reference: HonoAdapter,
      scope: 'singleton',
      condition: (config, components) => !components.honoAdapter,
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

export { HonoAdapter, HonoControllerRegistrar };

/** @deprecated Use honoStarter() */
export const honoAutoConfiguration = honoStarter;
