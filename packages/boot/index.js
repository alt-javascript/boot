/* eslint-disable import/extensions */
import Boot from './Boot.js';

export { default as Application } from './Application.js';
export { Boot };

export const { boot } = Boot;
export const { root } = Boot;
export const { test } = Boot;
export { config } from '@alt-javascript/config';
