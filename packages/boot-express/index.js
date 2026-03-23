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
export function expressStarter() {
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

/** @deprecated Use expressStarter() */
export const expressAutoConfiguration = expressStarter;
