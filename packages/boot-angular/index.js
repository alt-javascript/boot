/**
 * @alt-javascript/boot-angular — Angular integration for CDI.
 *
 * Provides utilities to bridge CDI ApplicationContext into Angular
 * applications via Angular's dependency injection system. CDI beans
 * are registered as Angular providers using InjectionToken.
 *
 * Usage in Angular module:
 *   import { createCdiProviders } from '@alt-javascript/boot-angular';
 *
 *   // In app.module.ts or main.ts (standalone)
 *   const cdiProviders = await createCdiProviders({ contexts, config });
 *
 *   bootstrapApplication(AppComponent, {
 *     providers: [...cdiProviders],
 *   });
 *
 *   // In components:
 *   @Component({ ... })
 *   export class TodoComponent {
 *     constructor(@Inject('todoService') private todoService: TodoService) {}
 *   }
 *
 * Angular's DI and CDI operate at different layers:
 * - CDI manages application services (framework-agnostic business logic)
 * - Angular DI manages UI components and Angular-specific services
 * - This bridge registers CDI beans as Angular value providers
 *
 * Note: This package does NOT depend on Angular at runtime. It produces
 * provider config objects that Angular's bootstrapApplication() consumes.
 */
import { Boot } from '@alt-javascript/boot';
import { ApplicationContext } from '@alt-javascript/cdi';

/**
 * Boot CDI and produce Angular provider definitions.
 *
 * Returns an array of { provide, useValue } objects compatible with
 * Angular's providers array.
 *
 * @param {object} options
 * @param {Array} options.contexts — CDI Context instances
 * @param {object} options.config — config object
 * @returns {Promise<{ applicationContext, providers }>}
 */
export async function createCdiProviders(options) {
  const { contexts, config } = options;

  const appCtx = new ApplicationContext({ contexts, config });
  await appCtx.start({ run: false });

  const providers = [
    { provide: 'applicationContext', useValue: appCtx },
  ];

  const components = appCtx.components;
  for (const name of Object.keys(components)) {
    if (components[name].instance) {
      providers.push({ provide: name, useValue: components[name].instance });
    }
  }

  return { applicationContext: appCtx, providers };
}

/**
 * Utility: wrap CDI beans as a lookup service injectable in Angular.
 *
 * Angular components can inject this service and call getBean() to
 * resolve CDI beans by name — useful when you don't want a separate
 * provider for every bean.
 *
 *   @Component({ ... })
 *   export class MyComponent {
 *     constructor(@Inject('cdiService') private cdi: CdiService) {
 *       const svc = this.cdi.getBean('greetingService');
 *     }
 *   }
 */
export class CdiService {
  constructor(applicationContext) {
    this._ctx = applicationContext;
  }

  getBean(name) {
    return this._ctx.get(name);
  }

  get applicationContext() {
    return this._ctx;
  }
}

/**
 * Create providers including a CdiService for dynamic bean lookup.
 *
 * @param {object} options — same as createCdiProviders
 * @returns {Promise<{ applicationContext, providers }>}
 */
export async function createCdiProvidersWithService(options) {
  const { applicationContext, providers } = await createCdiProviders(options);

  const cdiService = new CdiService(applicationContext);
  providers.push({ provide: 'cdiService', useValue: cdiService });

  return { applicationContext, providers };
}

/**
 * Boot CDI via Boot.boot() and produce Angular provider definitions.
 *
 * Mirrors the vueStarter/reactStarter pattern — calls Boot.boot() for full
 * profile URL resolution, ${placeholder} expansion, banner, logger setup,
 * and CDI wiring. Config may be a plain POJO.
 *
 * Returns Angular provider objects ready for bootstrapApplication():
 *
 *   const { providers } = await angularStarter({ contexts, config });
 *   bootstrapApplication(AppComponent, { providers });
 *
 * @param {object} options
 * @param {Array}  options.contexts — CDI Context instances (required)
 * @param {object} [options.config] — config POJO or config object
 * @returns {Promise<{ applicationContext, providers }>}
 */
export async function angularStarter(options) {
  const { contexts } = options;
  if (!contexts) throw new Error('angularStarter: options.contexts is required.');

  const appCtx = await Boot.boot({ config: options.config, contexts, run: false });

  const providers = [
    { provide: 'applicationContext', useValue: appCtx },
  ];

  for (const name of Object.keys(appCtx.components)) {
    if (appCtx.components[name].instance) {
      providers.push({ provide: name, useValue: appCtx.components[name].instance });
    }
  }

  const cdiService = new CdiService(appCtx);
  providers.push({ provide: 'cdiService', useValue: cdiService });

  return { applicationContext: appCtx, providers };
}
