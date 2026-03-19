# Getting Started

This tutorial walks you through building a working application with `@alt-javascript`. By the end, you'll have a service with dependency injection, configuration, logging, and lifecycle hooks.

## Prerequisites

- Node.js 18 or later
- npm

## Install

```bash
mkdir my-app && cd my-app
npm init -y
npm install @alt-javascript/boot @alt-javascript/cdi @alt-javascript/config @alt-javascript/logger
```

Add `"type": "module"` to your `package.json` (the framework uses ES modules).

## Step 1: Define Your Components

Create `services.js`:

```javascript
export class GreetingRepository {
  constructor() {
    this.greetings = ['Hello', 'Hi', 'Hey'];
  }

  getRandom() {
    return this.greetings[Math.floor(Math.random() * this.greetings.length)];
  }
}

export class GreetingService {
  constructor() {
    this.greetingRepository = null; // will be autowired
  }

  greet(name) {
    const greeting = this.greetingRepository.getRandom();
    return `${greeting}, ${name}!`;
  }
}
```

The key pattern: `GreetingService` declares a `greetingRepository` property initialised to `null`. The IoC container matches this property name to the registered `GreetingRepository` component and injects the singleton instance.

## Step 2: Create a Config File

Create `config/default.json`:

```json
{
  "logging": {
    "level": {
      "ROOT": "info"
    }
  },
  "app": {
    "name": "My First App"
  }
}
```

## Step 3: Wire and Run

Create `app.js`:

```javascript
import { Boot } from '@alt-javascript/boot';
import { ApplicationContext, Context, Singleton } from '@alt-javascript/cdi';
import { EphemeralConfig } from '@alt-javascript/config';
import { GreetingRepository, GreetingService } from './services.js';

const config = new EphemeralConfig({
  logging: { level: { ROOT: 'info' } },
  app: { name: 'My First App' },
});

Boot.boot({ config });

const context = new Context([
  new Singleton(GreetingRepository),
  new Singleton(GreetingService),
]);

const appCtx = new ApplicationContext({ contexts: [context], config });
await appCtx.start();

const service = appCtx.get('greetingService');
console.log(service.greet('World'));
```

Run it:

```bash
node app.js
# Output: Hello, World! (or Hi, World! or Hey, World!)
```

## Step 4: Add Lifecycle Hooks

Components can implement `init()` for startup logic and `destroy()` for cleanup:

```javascript
export class GreetingService {
  constructor() {
    this.greetingRepository = null;
    this.callCount = 0;
  }

  init() {
    console.log('GreetingService initialized');
  }

  greet(name) {
    this.callCount++;
    const greeting = this.greetingRepository.getRandom();
    return `${greeting}, ${name}!`;
  }

  destroy() {
    console.log(`GreetingService shutting down. Total greetings: ${this.callCount}`);
  }
}
```

The container calls `init()` during the prepare phase and registers `destroy()` for process shutdown.

## Step 5: Use Constructor Injection

For dependencies that must be available at construction time:

```javascript
export class NotificationService {
  constructor(greetingService) {
    this.greetingService = greetingService;
  }

  notify(name) {
    return `[NOTIFICATION] ${this.greetingService.greet(name)}`;
  }
}
```

Register with `constructorArgs`:

```javascript
const context = new Context([
  new Singleton(GreetingRepository),
  new Singleton(GreetingService),
  { Reference: NotificationService, name: 'notificationService', constructorArgs: ['greetingService'] },
]);
```

## What's Next

- [Dependency Injection](dependency-injection.md) — scopes, explicit wiring, profiles
- [Configuration](configuration.md) — property sources, profiles, environment variables
- [Lifecycle & Events](lifecycle.md) — events, BeanPostProcessor, lifecycle interfaces
- [Advanced Features](advanced.md) — AOP, auto-discovery, conditional beans
