/**
 * @alt-javascript/boot-fastify — Fastify adapter for the alt-javascript framework.
 *
 * Provides CDI-managed Fastify server with controller auto-registration.
 *
 * Usage:
 *   import { fastifyStarter } from '@alt-javascript/boot-fastify';
 *   const context = new Context([...fastifyStarter(), ...yourComponents]);
 */
import FastifyAdapter from './FastifyAdapter.js';
import FastifyControllerRegistrar from './FastifyControllerRegistrar.js';

/**
 * Returns CDI component definitions that auto-configure Fastify.
 *
 * Registers:
 * - `fastifyAdapter` — CDI-managed Fastify server with lifecycle hooks
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
  ];
}

export { FastifyAdapter, FastifyControllerRegistrar };

/** @deprecated Use fastifyStarter() */
export const fastifyAutoConfiguration = fastifyStarter;
