/**
 * example-1-1-intro-config
 *
 * Introduces @alt-javascript/config in isolation.
 * No CDI, no logging framework, no boot — just config.
 *
 * Key concepts:
 *   - `import { config }` gives you a ProfileConfigLoader-backed config instance,
 *     ready to use with no setup. Reads config files from the current directory.
 *   - .has(path) / .get(path, default) interface
 *   - NODE_ACTIVE_PROFILES selects overlay files (application-{profile}.yaml, .json, .properties)
 *   - application.properties (top-level) + config/application.json can coexist
 *   - ENC(...) values are decrypted transparently (jasypt-compatible)
 *
 * Config files in this example:
 *   application.properties  — top-level; shows .properties format + ENC() encryption
 *   config/application.json — JSON format; provides greeting, port, retries
 *   config/application-dev.yaml — YAML format dev overlay; overrides greeting + port
 *
 * Run:
 *   npm start               # uses application.json + application.properties (default)
 *   npm run start:dev       # overlays application-dev.yaml (G'day, port 9090)
 */

// Import the default config — backed by ProfileConfigLoader, no setup needed.
import { config } from '@alt-javascript/config';

const appName = config.get('app.name');
const greeting = config.get('app.greeting');
const port = config.get('server.port');
const maxRetries = config.get('app.maxRetries', 5); // default used if not in config
const secret = config.get('app.secret', 'not-set'); // ENC(...) decrypted transparently

console.log(`App:       ${appName}`);
console.log(`Greeting:  ${greeting}`);
console.log(`Port:      ${port}`);
console.log(`Retries:   ${maxRetries}`);
console.log(`Secret:    ${secret}`);
console.log(`Has theme: ${config.has('app.theme')}`); // false — not in config

console.log('\nProfile-sensitive values (change with NODE_ACTIVE_PROFILES=dev):');
console.log(`  app.greeting = ${config.get('app.greeting')}`);
console.log(`  server.port  = ${config.get('server.port')}`);
