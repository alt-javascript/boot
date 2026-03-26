/* eslint-disable import/extensions */
import Boot from './Boot.js';

export { default as Application } from './Application.js';
export { default as MiddlewarePipeline } from './MiddlewarePipeline.js';
export { RequestLoggerMiddleware, ErrorHandlerMiddleware, NotFoundMiddleware } from './middleware/index.js';
export { Boot };

export const { boot } = Boot;
export const { root } = Boot;
export const { test } = Boot;
export { printBanner } from './Boot.js';
export { config } from '@alt-javascript/config';
