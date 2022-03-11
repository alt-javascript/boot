/* eslint-disable import/extensions */
import Boot from './Boot.js';

export { default as Application } from './Application.js';
export { Boot };

export let boot = Boot.boot;
export let root = Boot.root;
export let test = Boot.test;
export { config } from '@alt-javascript/config';
