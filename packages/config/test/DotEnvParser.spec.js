/* eslint-disable import/extensions */
import { assert } from 'chai';
import DotEnvParser from '../DotEnvParser.js';

describe('DotEnvParser', () => {
  describe('bare KEY=VALUE', () => {
    it('parses a simple key=value pair', () => {
      const result = DotEnvParser.parse('KEY=value');
      assert.equal(result.KEY, 'value');
    });

    it('parses multiple keys', () => {
      const result = DotEnvParser.parse('FOO=bar\nBAZ=qux');
      assert.equal(result.FOO, 'bar');
      assert.equal(result.BAZ, 'qux');
    });

    it('empty value produces empty string', () => {
      const result = DotEnvParser.parse('KEY=');
      assert.equal(result.KEY, '');
    });

    it('handles windows line endings', () => {
      const result = DotEnvParser.parse('FOO=bar\r\nBAZ=qux');
      assert.equal(result.FOO, 'bar');
      assert.equal(result.BAZ, 'qux');
    });
  });

  describe('export prefix', () => {
    it('strips "export " prefix', () => {
      const result = DotEnvParser.parse('export KEY=value');
      assert.equal(result.KEY, 'value');
    });

    it('strips export with extra spacing', () => {
      const result = DotEnvParser.parse('export   KEY=value');
      assert.equal(result.KEY, 'value');
    });
  });

  describe('double-quoted values', () => {
    it('strips double quotes', () => {
      const result = DotEnvParser.parse('KEY="hello world"');
      assert.equal(result.KEY, 'hello world');
    });

    it('processes \\n escape', () => {
      const result = DotEnvParser.parse('KEY="line1\\nline2"');
      assert.equal(result.KEY, 'line1\nline2');
    });

    it('processes \\t escape', () => {
      const result = DotEnvParser.parse('KEY="col1\\tcol2"');
      assert.equal(result.KEY, 'col1\tcol2');
    });

    it('processes \\r escape', () => {
      const result = DotEnvParser.parse('KEY="a\\rb"');
      assert.equal(result.KEY, 'a\rb');
    });

    it('processes \\\\ escape', () => {
      const result = DotEnvParser.parse('KEY="back\\\\slash"');
      assert.equal(result.KEY, 'back\\slash');
    });

    it('processes \\" escape', () => {
      const result = DotEnvParser.parse('KEY="say \\"hi\\""');
      assert.equal(result.KEY, 'say "hi"');
    });

    it('processes \\$ escape', () => {
      const result = DotEnvParser.parse('KEY="cost \\$5"');
      assert.equal(result.KEY, 'cost $5');
    });

    it('ignores content after closing quote', () => {
      const result = DotEnvParser.parse('KEY="val" # ignored comment');
      assert.equal(result.KEY, 'val');
    });

    it('handles empty double-quoted value', () => {
      const result = DotEnvParser.parse('KEY=""');
      assert.equal(result.KEY, '');
    });
  });

  describe('single-quoted values', () => {
    it('strips single quotes', () => {
      const result = DotEnvParser.parse("KEY='hello world'");
      assert.equal(result.KEY, 'hello world');
    });

    it('no escape processing inside single quotes', () => {
      const result = DotEnvParser.parse("KEY='no\\nescape'");
      assert.equal(result.KEY, 'no\\nescape');
    });

    it('literal backslash in single-quoted value', () => {
      const result = DotEnvParser.parse("KEY='back\\\\slash'");
      assert.equal(result.KEY, 'back\\\\slash');
    });

    it('hash inside single quotes is not a comment', () => {
      const result = DotEnvParser.parse("KEY='val#notcomment'");
      assert.equal(result.KEY, 'val#notcomment');
    });

    it('handles empty single-quoted value', () => {
      const result = DotEnvParser.parse("KEY=''");
      assert.equal(result.KEY, '');
    });
  });

  describe('inline comments on unquoted values', () => {
    it('strips inline comment preceded by space', () => {
      const result = DotEnvParser.parse('KEY=value # this is a comment');
      assert.equal(result.KEY, 'value');
    });

    it('strips inline comment preceded by tab', () => {
      const result = DotEnvParser.parse('KEY=value\t# this is a comment');
      assert.equal(result.KEY, 'value');
    });

    it('does not strip # embedded in value without preceding whitespace', () => {
      const result = DotEnvParser.parse('KEY=val#embedded');
      assert.equal(result.KEY, 'val#embedded');
    });

    it('handles value that is only a comment', () => {
      const result = DotEnvParser.parse('KEY= # just a comment');
      assert.equal(result.KEY, '');
    });
  });

  describe('comment and blank lines', () => {
    it('ignores # comment lines', () => {
      const result = DotEnvParser.parse('# this is a comment\nKEY=value');
      assert.equal(result.KEY, 'value');
      assert.isUndefined(result['# this is a comment']);
    });

    it('ignores blank lines', () => {
      const result = DotEnvParser.parse('\n\nKEY=value\n\n');
      assert.equal(result.KEY, 'value');
      assert.equal(Object.keys(result).length, 1);
    });

    it('ignores lines without = separator', () => {
      const result = DotEnvParser.parse('MALFORMED\nKEY=value');
      assert.equal(result.KEY, 'value');
      assert.isUndefined(result.MALFORMED);
    });
  });

  describe('realistic .env content', () => {
    it('parses a typical application .env file', () => {
      const content = [
        '# Application settings',
        'APP_NAME=MyApp',
        'APP_PORT=3000',
        '',
        '# Database',
        'export DATABASE_URL=postgres://localhost:5432/mydb',
        'DB_POOL_SIZE=10',
        '',
        '# Feature flags',
        'ENABLE_CACHE=true',
        'LOG_LEVEL=info # debug in dev',
        '',
        'SECRET_KEY="super secret value with spaces"',
        "LITERAL_VALUE='no\\nescape here'",
      ].join('\n');

      const result = DotEnvParser.parse(content);

      assert.equal(result.APP_NAME, 'MyApp');
      assert.equal(result.APP_PORT, '3000');
      assert.equal(result.DATABASE_URL, 'postgres://localhost:5432/mydb');
      assert.equal(result.DB_POOL_SIZE, '10');
      assert.equal(result.ENABLE_CACHE, 'true');
      assert.equal(result.LOG_LEVEL, 'info');
      assert.equal(result.SECRET_KEY, 'super secret value with spaces');
      assert.equal(result.LITERAL_VALUE, 'no\\nescape here');
    });
  });
});
