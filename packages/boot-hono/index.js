import HonoAdapter from './HonoAdapter.js';
import HonoControllerRegistrar from './HonoControllerRegistrar.js';

export function honoStarter() {
  return [
    {
      name: 'honoAdapter',
      Reference: HonoAdapter,
      scope: 'singleton',
      condition: (config, components) => !components.honoAdapter,
    },
  ];
}

export { HonoAdapter, HonoControllerRegistrar };

/** @deprecated Use honoStarter() */
export const honoAutoConfiguration = honoStarter;
