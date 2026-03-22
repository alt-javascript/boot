/**
 * example-1-intro-config
 *
 * Introduces @alt-javascript/config in isolation.
 * No CDI, no logging framework, no boot — just config.
 *
 * Key concepts:
 *   - ProfileConfigLoader reads application.json + active profile overlay
 *   - .has(path) / .get(path, default) interface
 *   - NODE_ACTIVE_PROFILES selects the overlay file
 *
 * Run:
 *   npm start               # uses application.json only
 *   npm run start:dev       # overlays application-dev.json
 */
import { ProfileConfigLoader } from '@alt-javascript/config';

// Load config — reads config/application.json, then overlays
// config/application-{profile}.json for each active profile.
const config = ProfileConfigLoader.load();

const appName = config.get('app.name');
const greeting = config.get('app.greeting');
const port = config.get('server.port');
const maxRetries = config.get('app.maxRetries', 5); // default used if not in config

console.log(`App:       ${appName}`);
console.log(`Greeting:  ${greeting}`);
console.log(`Port:      ${port}`);
console.log(`Retries:   ${maxRetries}`);
console.log(`Has theme: ${config.has('app.theme')}`); // false — not in config

// Dot-notation path to nested values
console.log('\nProfile-sensitive values:');
console.log(`  server.port = ${config.get('server.port')}`);
// default profile → 8080; dev profile → 9090
