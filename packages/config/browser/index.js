/* eslint-disable import/extensions */
export { default as DelegatingConfig } from '../DelegatingConfig.js';
export { default as DelegatingResolver } from '../DelegatingResolver.js';
export { default as EphemeralConfig } from '../EphemeralConfig.js';
export { default as Resolver } from '../Resolver.js';
export { default as PlaceHolderResolver } from '../PlaceHolderResolver.js';
export { default as PlaceHolderSelector } from '../PlaceHolderSelector.js';
export { default as PrefixSelector } from '../PrefixSelector.js';
export { default as SelectiveResolver } from '../SelectiveResolver.js';
export { default as Selector } from '../Selector.js';
export { default as URLResolver } from '../URLResolver.js';
export { default as ValueResolvingConfig } from '../ValueResolvingConfig.js';
export { default as ProfileAwareConfig } from '../ProfileAwareConfig.js';
export { default as BrowserProfileResolver } from '../BrowserProfileResolver.js';
export { default as ConfigFactory } from './ConfigFactory.js';

// Browser-safe sentinel for `import { config } from '@alt-javascript/config'`.
// In browser builds, callers pass config explicitly — the global singleton is never used.
// LoggerFactory.detectConfig() and ApplicationContext fall back to this, but Boot.boot()
// always populates global.boot.contexts.root.config before CDI starts, so the
// fallback path is only taken if the caller forgot to pass config.
import EphemeralConfig from '../EphemeralConfig.js';
export const config = new EphemeralConfig({});
