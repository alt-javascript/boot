/**
 * Java .properties file parser.
 *
 * Supports:
 * - key=value, key:value, key value
 * - # and ! comment lines
 * - blank lines skipped
 * - \ line continuation
 * - dotted keys → nested objects: a.b.c=1 → { a: { b: { c: '1' } } }
 * - array notation: a.b[0]=x, a.b[1]=y → { a: { b: ['x', 'y'] } }
 * - array of objects: a.b[0].x=1, a.b[0].y=2 → { a: { b: [{ x: '1', y: '2' }] } }
 * - unicode escapes: \uXXXX
 * - standard escapes: \n, \t, \r, \\, \=, \:
 */
export default class PropertiesParser {
  /**
   * Parse a .properties string into a nested JS object.
   * @param {string} text - raw .properties file content
   * @returns {object} nested plain object
   */
  static parse(text) {
    const lines = PropertiesParser._joinContinuationLines(text);
    const flat = {};

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length === 0 || trimmed.startsWith('#') || trimmed.startsWith('!')) {
        continue;
      }
      const { key, value } = PropertiesParser._parseLine(trimmed);
      if (key !== null) {
        flat[key] = value;
      }
    }

    return PropertiesParser._unflatten(flat);
  }

  /**
   * Join lines ending with \ into single logical lines.
   */
  static _joinContinuationLines(text) {
    const raw = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    const result = [];
    let current = '';

    for (let i = 0; i < raw.length; i++) {
      const line = raw[i];
      // Count trailing backslashes
      let trailing = 0;
      for (let j = line.length - 1; j >= 0 && line[j] === '\\'; j--) {
        trailing++;
      }
      if (trailing % 2 === 1) {
        // Odd number of trailing backslashes = continuation
        current += line.slice(0, -1);
      } else {
        current += line;
        result.push(current);
        current = '';
      }
    }
    if (current.length > 0) {
      result.push(current);
    }
    return result;
  }

  /**
   * Parse a single logical line into key and value.
   * Separators: first unescaped = or : or whitespace.
   */
  static _parseLine(line) {
    let i = 0;
    let key = '';

    // Skip leading whitespace
    while (i < line.length && (line[i] === ' ' || line[i] === '\t')) {
      i++;
    }

    // Read key until unescaped separator
    let foundSeparator = false;
    while (i < line.length) {
      const ch = line[i];
      if (ch === '\\' && i + 1 < line.length) {
        key += PropertiesParser._unescape(line[i + 1]);
        i += 2;
        continue;
      }
      if (ch === '=' || ch === ':') {
        i++; // skip separator
        foundSeparator = true;
        break;
      }
      if (ch === ' ' || ch === '\t') {
        foundSeparator = true;
        // Skip whitespace, then optional = or :
        while (i < line.length && (line[i] === ' ' || line[i] === '\t')) {
          i++;
        }
        if (i < line.length && (line[i] === '=' || line[i] === ':')) {
          i++;
        }
        break;
      }
      key += ch;
      i++;
    }

    if (key.length === 0) {
      return { key: null, value: null };
    }

    // Skip leading whitespace in value
    while (i < line.length && (line[i] === ' ' || line[i] === '\t')) {
      i++;
    }

    // Read value with escape processing
    let value = '';
    while (i < line.length) {
      const ch = line[i];
      if (ch === '\\' && i + 1 < line.length) {
        if (line[i + 1] === 'u' && i + 5 < line.length) {
          const hex = line.substring(i + 2, i + 6);
          if (/^[0-9a-fA-F]{4}$/.test(hex)) {
            value += String.fromCharCode(parseInt(hex, 16));
            i += 6;
            continue;
          }
        }
        value += PropertiesParser._unescape(line[i + 1]);
        i += 2;
        continue;
      }
      value += ch;
      i++;
    }

    return { key, value };
  }

  static _unescape(ch) {
    switch (ch) {
      case 'n': return '\n';
      case 't': return '\t';
      case 'r': return '\r';
      case '\\': return '\\';
      case '=': return '=';
      case ':': return ':';
      case ' ': return ' ';
      default: return ch;
    }
  }

  /**
   * Convert flat dotted keys with array notation into nested object.
   *
   * a.b.c=1           → { a: { b: { c: '1' } } }
   * a.b[0]=x           → { a: { b: ['x'] } }
   * a.b[0].x=1         → { a: { b: [{ x: '1' }] } }
   */
  static _unflatten(flat) {
    const root = {};

    for (const [dottedKey, value] of Object.entries(flat)) {
      const segments = PropertiesParser._parseKeyPath(dottedKey);
      let current = root;

      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        const isLast = i === segments.length - 1;

        if (seg.index !== undefined) {
          // Segment has array index: ensure parent[key] is an array
          if (!(seg.key in current)) {
            current[seg.key] = [];
          }
          const arr = current[seg.key];

          if (isLast) {
            arr[seg.index] = value;
          } else {
            if (arr[seg.index] === undefined) {
              arr[seg.index] = {};
            }
            current = arr[seg.index];
          }
        } else if (isLast) {
          current[seg.key] = value;
        } else {
          // Plain key, not last — ensure nested container exists
          if (!(seg.key in current)) {
            current[seg.key] = {};
          }
          current = current[seg.key];
        }
      }
    }

    return root;
  }

  /**
   * Parse a dotted key like "a.b[0].c" into segments:
   * [{ key: 'a' }, { key: 'b', index: 0 }, { key: 'c' }]
   */
  static _parseKeyPath(dottedKey) {
    const segments = [];
    const parts = dottedKey.split('.');

    for (const part of parts) {
      const match = part.match(/^([^[]+)\[(\d+)\]$/);
      if (match) {
        segments.push({ key: match[1], index: parseInt(match[2], 10) });
      } else {
        segments.push({ key: part });
      }
    }

    return segments;
  }
}
