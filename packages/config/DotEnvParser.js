/**
 * .env file parser.
 *
 * Supports the standard .env format used by dotenv and compatible tools:
 * - KEY=VALUE                           bare value
 * - export KEY=VALUE                    'export' prefix stripped
 * - KEY="double quoted"                 double quotes stripped, escape sequences processed
 * - KEY='single quoted'                 single quotes stripped, no escape processing
 * - KEY=value # inline comment          inline comment stripped (unquoted values only)
 * - KEY=                                empty string value
 * - # comment line                      ignored
 * - blank lines                         ignored
 *
 * Keys are kept verbatim (e.g. MY_APP_PORT).
 * Relaxed binding (MY_APP_PORT → my.app.port) is handled downstream by EnvPropertySource.
 *
 * Out of scope for v1:
 * - Multiline values (backslash-continuation or newlines inside double quotes)
 * - Variable interpolation ($VAR or ${VAR})
 */
export default class DotEnvParser {
  /**
   * Parse a .env string into a flat key→value object.
   * @param {string} text - raw .env file content
   * @returns {object} flat plain object { KEY: 'value', ... }
   */
  static parse(text) {
    const result = {};
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

    for (const rawLine of lines) {
      const line = rawLine.trim();

      // Skip blank lines and comment lines
      if (line.length === 0 || line.startsWith('#')) {
        continue;
      }

      // Strip optional 'export ' prefix
      const stripped = line.startsWith('export ') ? line.slice(7).trimStart() : line;

      // Find the first '=' separator
      const eqIdx = stripped.indexOf('=');
      if (eqIdx === -1) {
        // No separator — skip malformed line
        continue;
      }

      const key = stripped.slice(0, eqIdx).trim();
      if (key.length === 0) {
        continue;
      }

      const rawValue = stripped.slice(eqIdx + 1);
      result[key] = DotEnvParser._parseValue(rawValue);
    }

    return result;
  }

  /**
   * Parse the value portion of a KEY=<value> line.
   *
   * - Double-quoted: strip quotes, process escape sequences
   * - Single-quoted: strip quotes, no escape processing
   * - Unquoted: strip inline comment and trailing whitespace
   *
   * @param {string} raw - everything after the first '='
   * @returns {string}
   */
  static _parseValue(raw) {
    const trimmed = raw.trimStart();

    if (trimmed.startsWith('"')) {
      return DotEnvParser._parseDoubleQuoted(trimmed);
    }

    if (trimmed.startsWith("'")) {
      return DotEnvParser._parseSingleQuoted(trimmed);
    }

    return DotEnvParser._parseUnquoted(raw);
  }

  /**
   * Parse a double-quoted value.
   * Finds the closing unescaped double quote and processes escape sequences
   * within the captured content.
   */
  static _parseDoubleQuoted(raw) {
    // raw starts with "
    let i = 1;
    let value = '';

    while (i < raw.length) {
      const ch = raw[i];

      if (ch === '\\' && i + 1 < raw.length) {
        value += DotEnvParser._unescape(raw[i + 1]);
        i += 2;
        continue;
      }

      if (ch === '"') {
        // Closing quote found — stop here (ignore anything after)
        break;
      }

      value += ch;
      i++;
    }

    return value;
  }

  /**
   * Parse a single-quoted value.
   * No escape processing — everything between the quotes is literal.
   */
  static _parseSingleQuoted(raw) {
    // raw starts with '
    const closeIdx = raw.indexOf("'", 1);
    if (closeIdx === -1) {
      // Unclosed quote — return everything after the opening quote
      return raw.slice(1);
    }
    return raw.slice(1, closeIdx);
  }

  /**
   * Parse an unquoted value.
   * Strip inline comments (first unescaped #) and trailing whitespace.
   *
   * Note: leading whitespace after '=' is preserved per dotenv convention
   * only if intentional, but in practice trimStart is the safe choice.
   */
  static _parseUnquoted(raw) {
    // Strip inline comment: first '#' that is preceded by whitespace or at start
    // We scan character-by-character to avoid stripping '#' embedded in values.
    let i = 0;
    while (i < raw.length) {
      const ch = raw[i];
      if (ch === '#') {
        // Only treat as comment if at start of value or preceded by whitespace
        if (i === 0 || raw[i - 1] === ' ' || raw[i - 1] === '\t') {
          return raw.slice(0, i).trimEnd();
        }
      }
      i++;
    }
    return raw.trimEnd();
  }

  /**
   * Process a single escape character following a backslash in a double-quoted value.
   */
  static _unescape(ch) {
    switch (ch) {
      case 'n':  return '\n';
      case 't':  return '\t';
      case 'r':  return '\r';
      case '\\': return '\\';
      case '"':  return '"';
      case "'":  return "'";
      case '$':  return '$';
      default:   return ch;
    }
  }
}
