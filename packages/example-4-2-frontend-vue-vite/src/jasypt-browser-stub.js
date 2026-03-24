/**
 * jasypt-browser-stub.js
 * Browser-safe no-op for @alt-javascript/jasypt.
 * Jasypt encrypted config values are not supported in browser builds —
 * use plain config values or environment variables instead.
 */
export default class Jasypt {
  decrypt(value) {
    return value; // no-op: return as-is
  }
  encrypt(value) {
    return value;
  }
}

export class Encryptor {}
export class Digester {}
