/**
 * @alt-javascript/jsdbc-template
 *
 * Spring JdbcTemplate-style database access for JSDBC.
 *
 * This package provides template classes for simplified JSDBC database access:
 *   - JsdbcTemplate          — query, update, execute, transactions
 *   - NamedParameterJsdbcTemplate — named :param placeholders
 *   - TransactionTemplate    — single-connection transaction callback
 *
 * CDI auto-configuration (DataSource + template beans wired from config) was
 * intentionally moved to @alt-javascript/boot-jsdbc. Developers who want to
 * use JsdbcTemplate outside of the Boot auto-configuration context import
 * this package directly without pulling in Boot CDI infrastructure.
 *
 * Usage (standalone):
 *   import { JsdbcTemplate } from '@alt-javascript/jsdbc-template';
 *   import { DataSource } from '@alt-javascript/jsdbc-core';
 *   import '@alt-javascript/jsdbc-sqljs';
 *
 *   const ds = new DataSource({ url: 'jsdbc:sqljs:memory' });
 *   const template = new JsdbcTemplate(ds);
 *   await template.execute('CREATE TABLE ...');
 *
 * Usage (with Boot CDI auto-configuration):
 *   import { jsdbcTemplateStarter } from '@alt-javascript/boot-jsdbc';
 */
export { default as JsdbcTemplate, TransactionTemplate } from './JsdbcTemplate.js';
export { default as NamedParameterJsdbcTemplate, parseNamedParams } from './NamedParameterJsdbcTemplate.js';
