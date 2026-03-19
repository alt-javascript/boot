/* eslint-disable import/extensions */
import { assert } from 'chai';
import PropertiesParser from '../PropertiesParser.js';

describe('PropertiesParser', () => {
  describe('basic key-value parsing', () => {
    it('parses key=value', () => {
      const result = PropertiesParser.parse('name=Craig');
      assert.deepEqual(result, { name: 'Craig' });
    });

    it('parses key:value', () => {
      const result = PropertiesParser.parse('name:Craig');
      assert.deepEqual(result, { name: 'Craig' });
    });

    it('parses key value (space separator)', () => {
      const result = PropertiesParser.parse('name Craig');
      assert.deepEqual(result, { name: 'Craig' });
    });

    it('trims whitespace around separator', () => {
      const result = PropertiesParser.parse('name = Craig');
      assert.deepEqual(result, { name: 'Craig' });
    });

    it('handles empty value', () => {
      const result = PropertiesParser.parse('name=');
      assert.deepEqual(result, { name: '' });
    });

    it('preserves value with spaces', () => {
      const result = PropertiesParser.parse('greeting = hello world');
      assert.deepEqual(result, { greeting: 'hello world' });
    });

    it('handles multiple properties', () => {
      const result = PropertiesParser.parse('a=1\nb=2\nc=3');
      assert.deepEqual(result, { a: '1', b: '2', c: '3' });
    });
  });

  describe('comments and blank lines', () => {
    it('skips # comments', () => {
      const result = PropertiesParser.parse('# comment\nname=Craig');
      assert.deepEqual(result, { name: 'Craig' });
    });

    it('skips ! comments', () => {
      const result = PropertiesParser.parse('! comment\nname=Craig');
      assert.deepEqual(result, { name: 'Craig' });
    });

    it('skips blank lines', () => {
      const result = PropertiesParser.parse('\n\nname=Craig\n\n');
      assert.deepEqual(result, { name: 'Craig' });
    });
  });

  describe('line continuation', () => {
    it('joins lines ending with backslash', () => {
      const result = PropertiesParser.parse('msg=hello \\\nworld');
      assert.deepEqual(result, { msg: 'hello world' });
    });

    it('double backslash at end is not continuation', () => {
      const result = PropertiesParser.parse('path=C:\\\\');
      assert.deepEqual(result, { path: 'C:\\' });
    });
  });

  describe('escape sequences', () => {
    it('handles \\n \\t \\r', () => {
      const result = PropertiesParser.parse('msg=line1\\nline2\\ttab');
      assert.deepEqual(result, { msg: 'line1\nline2\ttab' });
    });

    it('handles escaped separators in keys', () => {
      const result = PropertiesParser.parse('key\\=name=value');
      assert.deepEqual(result, { 'key=name': 'value' });
    });

    it('handles unicode escapes', () => {
      const result = PropertiesParser.parse('char=\\u0041');
      assert.deepEqual(result, { char: 'A' });
    });
  });

  describe('dotted keys → nested objects', () => {
    it('a.b.c=1 becomes nested', () => {
      const result = PropertiesParser.parse('a.b.c=1');
      assert.deepEqual(result, { a: { b: { c: '1' } } });
    });

    it('multiple dotted keys merge', () => {
      const result = PropertiesParser.parse('db.host=localhost\ndb.port=5432');
      assert.deepEqual(result, { db: { host: 'localhost', port: '5432' } });
    });

    it('three levels deep', () => {
      const result = PropertiesParser.parse('spring.datasource.url=jdbc:mysql://localhost');
      assert.deepEqual(result, { spring: { datasource: { url: 'jdbc:mysql://localhost' } } });
    });
  });

  describe('array notation', () => {
    it('a.b[0]=x, a.b[1]=y becomes array', () => {
      const result = PropertiesParser.parse('a.b[0]=x\na.b[1]=y');
      assert.deepEqual(result, { a: { b: ['x', 'y'] } });
    });

    it('array of objects: a.b[0].x=1, a.b[0].y=2', () => {
      const result = PropertiesParser.parse('a.b[0].x=1\na.b[0].y=2\na.b[1].x=3');
      assert.deepEqual(result, {
        a: {
          b: [
            { x: '1', y: '2' },
            { x: '3' },
          ],
        },
      });
    });

    it('top-level array', () => {
      const result = PropertiesParser.parse('items[0]=apple\nitems[1]=banana');
      assert.deepEqual(result, { items: ['apple', 'banana'] });
    });
  });

  describe('Spring-style config', () => {
    it('parses a realistic Spring-like properties file', () => {
      const input = [
        '# Database configuration',
        'spring.datasource.url=jdbc:mysql://localhost/mydb',
        'spring.datasource.username=root',
        'spring.datasource.password=secret',
        '',
        '# Server',
        'server.port=8080',
        'server.context-path=/api',
        '',
        '# Profiles',
        'spring.profiles.active=dev,local',
        '',
        '# Security roles',
        'security.roles[0]=USER',
        'security.roles[1]=ADMIN',
        'security.roles[2]=SUPERADMIN',
      ].join('\n');

      const result = PropertiesParser.parse(input);

      assert.equal(result.spring.datasource.url, 'jdbc:mysql://localhost/mydb');
      assert.equal(result.spring.datasource.username, 'root');
      assert.equal(result.server.port, '8080');
      assert.equal(result.server['context-path'], '/api');
      assert.deepEqual(result.security.roles, ['USER', 'ADMIN', 'SUPERADMIN']);
    });
  });

  describe('edge cases', () => {
    it('empty string returns empty object', () => {
      assert.deepEqual(PropertiesParser.parse(''), {});
    });

    it('only comments returns empty object', () => {
      assert.deepEqual(PropertiesParser.parse('# nothing here\n! or here'), {});
    });

    it('value with equals sign', () => {
      const result = PropertiesParser.parse('equation=1+1=2');
      assert.deepEqual(result, { equation: '1+1=2' });
    });

    it('handles Windows line endings', () => {
      const result = PropertiesParser.parse('a=1\r\nb=2\r\n');
      assert.deepEqual(result, { a: '1', b: '2' });
    });

    it('last value wins for duplicate keys', () => {
      const result = PropertiesParser.parse('a=1\na=2');
      assert.deepEqual(result, { a: '2' });
    });
  });
});
