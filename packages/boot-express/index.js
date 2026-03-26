/**
 * @alt-javascript/boot-express — Express adapter for the alt-javascript framework.
 *
 * Provides CDI-managed Express server with controller auto-registration.
 *
 * Usage:
 *   import { expressStarter } from '@alt-javascript/boot-express';
 *   const context = new Context([...expressStarter(), ...yourComponents]);
 */
import { conditionalOnMissingBean } from '@alt-javascript/cdi';
import {
  RequestLoggerMiddleware,
  ErrorHandlerMiddleware,
  NotFoundMiddleware,
} from '@alt-javascript/boot';
import ExpressAdapter from './ExpressAdapter.js';
import ControllerRegistrar from './ControllerRegistrar.js';

/**
 * Returns CDI component definitions that auto-configure Express.
 *
 * Registers:
 * - `expressAdapter` — CDI-managed Express server with lifecycle hooks
 * - `requestLoggerMiddleware` — per-request logging (order: 10)
 * - `errorHandlerMiddleware` — exception → structured response (order: 20)
 * - `notFoundMiddleware` — null route result → 404 (order: 30)
 *
 * Any of the middleware can be replaced by registering a component with the
 * same name before calling expressStarter().
 *
 * @returns {Array} component definitions for CDI Context
 */
export function expressStarter() {
  return [
    {
      name: 'expressAdapter',
      Reference: ExpressAdapter,
      scope: 'singleton',
      condition: (config, components) => !components.expressAdapter,
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

export { ExpressAdapter, ControllerRegistrar };

/** @deprecated Use expressStarter() */
export const expressAutoConfiguration = expressStarter;
