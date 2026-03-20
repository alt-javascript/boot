import KoaAdapter from './KoaAdapter.js';
import KoaControllerRegistrar from './KoaControllerRegistrar.js';

export function koaAutoConfiguration() {
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
