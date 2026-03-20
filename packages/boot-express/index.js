/**
 * @alt-javascript/boot-express — Express adapter for the alt-javascript framework.
 *
 * Provides CDI-managed Express server with controller auto-registration.
 *
 * Usage:
 *   import { expressAutoConfiguration } from '@alt-javascript/boot-express';
 *   const context = new Context([...expressAutoConfiguration(), ...yourComponents]);
 */
import { conditionalOnMissingBean } from '@alt-javascript/cdi';
import ExpressAdapter from './ExpressAdapter.js';
import ControllerRegistrar from './ControllerRegistrar.js';

/**
 * Returns CDI component definitions that auto-configure Express.
 *
 * Registers:
 * - `expressAdapter` — CDI-managed Express server with lifecycle hooks
 *
 * @returns {Array} component definitions for CDI Context
 */
export function expressAutoConfiguration() {
  return [
    {
      name: 'expressAdapter',
      Reference: ExpressAdapter,
      scope: 'singleton',
      condition: (config, components) => !components.expressAdapter,
    },
  ];
}

export { ExpressAdapter, ControllerRegistrar };
