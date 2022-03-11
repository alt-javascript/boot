/* eslint-disable import/extensions */
import Boot from './Boot-browser.js';

export { default as Application } from './Application-browser.js';
export { Boot };

export let boot = Boot.boot;
export let root = Boot.root;
export let test = Boot.test;
