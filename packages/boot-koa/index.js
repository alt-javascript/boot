/**
 * @alt-javascript/boot-koa — Koa adapter for the alt-javascript framework.
 *
 * Provides CDI-managed Koa server with controller auto-registration.
 *
 * Usage:
 *   import { koaStarter } from '@alt-javascript/boot-koa';
 *   const context = new Context([...koaStarter(), ...yourComponents]);
 */
import KoaAdapter from './KoaAdapter.js';
import KoaControllerRegistrar from './KoaControllerRegistrar.js';

/**
 * Returns CDI component definitions that auto-configure Koa.
 *
 * Registers:
 * - `koaAdapter` — CDI-managed Koa server with lifecycle hooks
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
  ];
}

export { KoaAdapter, KoaControllerRegistrar };

/** @deprecated Use koaStarter() */
export const koaAutoConfiguration = koaStarter;
