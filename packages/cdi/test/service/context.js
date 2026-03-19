const {
  Context, Component, Scopes, Profile, Property,
} = require('../../context');

module.exports.context = new Context(
  [
    new Component(module.exports.AutoService),
    new Component(module.exports.ManualService,
      'manualService',
      '@alt-javascript/cdi/example/service/ManualService',
      Scopes.SINGLETON,
      [
        Property('logger', { factory: 'LoggerFactory', method: 'getLogger', args: ['@alt-javascript/cdi/example/service/ManualService'] }),
        Property('autoService', { reference: 'autoService' }),
        Property('someProperty', { value: 'myconfigpath', default: 'myDefault' }),
        Property('someEntry', 'someEntry'),
      ],
      Profile('some', true)),
  ],
);
