/**
 * @alt-javascript/boot-fastify — Fastify adapter for the alt-javascript framework.
 *
 * Provides CDI-managed Fastify server with controller auto-registration.
 *
 * Usage:
 *   import { fastifyStarter } from '@alt-javascript/boot-fastify';
 *   const context = new Context([...fastifyStarter(), ...yourComponents]);
 */
import {
  RequestLoggerMiddleware,
  ErrorHandlerMiddleware,
  NotFoundMiddleware,
} from '@alt-javascript/boot';
import FastifyAdapter from './FastifyAdapter.js';
import FastifyControllerRegistrar from './FastifyControllerRegistrar.js';

/**
 * Returns CDI component definitions that auto-configure Fastify.
 *
 * Registers:
 * - `fastifyAdapter` — CDI-managed Fastify server with lifecycle hooks
 * - `requestLoggerMiddleware` — per-request logging (order: 10)
 * - `errorHandlerMiddleware` — exception → structured response (order: 20)
 * - `notFoundMiddleware` — null route result → 404 (order: 30)
 *
 * @returns {Array} component definitions for CDI Context
 */
export function fastifyStarter() {
  return [
    {
      name: 'fastifyAdapter',
      Reference: FastifyAdapter,
      scope: 'singleton',
      condition: (config, components) => !components.fastifyAdapter,
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

export { FastifyAdapter, FastifyControllerRegistrar };

/** @deprecated Use fastifyStarter() */
export const fastifyAutoConfiguration = fastifyStarter;
