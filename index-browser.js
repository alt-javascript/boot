/* eslint-disable import/extensions */
import Boot from './Boot-browser.js';

export { default as Application } from './Application-browser.js';
export { Boot };

export const { boot } = Boot;
export const { root } = Boot;
export const { test } = Boot;
