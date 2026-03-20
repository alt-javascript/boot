import HonoAdapter from './HonoAdapter.js';
import HonoControllerRegistrar from './HonoControllerRegistrar.js';

export function honoAutoConfiguration() {
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
