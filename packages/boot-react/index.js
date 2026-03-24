/**
 * @alt-javascript/boot-react — React integration for @alt-javascript/boot.
 *
 * Bridges Boot CDI into React applications via React Context API and hooks.
 * Works with both functional components (hooks) and class components.
 *
 * ## CLI-first (Vite / CRA) — recommended
 *
 *   // main.jsx — app entry point
 *   import React from 'react';
 *   import { createRoot } from 'react-dom/client';
 *   import { reactStarter } from '@alt-javascript/boot-react';
 *   import { Context, Singleton } from '@alt-javascript/cdi';
 *   import App from './App.jsx';
 *   import { TodoService } from './services.js';
 *
 *   const { CdiProvider } = await reactStarter({
 *     React,
 *     createRoot,
 *     selector: '#root',
 *     rootComponent: App,
 *     contexts: [new Context([new Singleton(TodoService)])],
 *     config: {
 *       app: { name: 'My App' },
 *       profiles: { urls: { 'localhost:5173': 'dev' } },
 *     },
 *   });
 *
 *   // App.jsx — access CDI beans via hooks
 *   function App() {
 *     const todoService = useBean('todoService');
 *     ...
 *   }
 *
 * ## Headless / testing
 *
 *   import { bootCdiHeadless } from '@alt-javascript/boot-react';
 *   const ctx = await bootCdiHeadless({ contexts, config });
 *   const svc = ctx.get('todoService');
 *
 * Note: This package does NOT depend on React at runtime. It provides
 * factory functions that create React-bound utilities when React is
 * available. This keeps the package testable without a React DOM.
 */
import { Boot } from '@alt-javascript/boot';
import { ApplicationContext } from '@alt-javascript/cdi';

/**
 * Boot CDI via Boot.boot() and mount a React app with all singletons
 * available via useCdi() / useBean() hooks anywhere in the tree.
 *
 * Config may be a plain POJO — Boot.boot() handles profile URL resolution,
 * ${placeholder} expansion, profile overlays, logger setup, and the global
 * registry automatically.
 *
 * @param {object}   options
 * @param {object}   options.React           — React module (required)
 * @param {Function} options.createRoot      — ReactDOM.createRoot (required)
 * @param {Array}    options.contexts        — CDI Context instances (required)
 * @param {object}   [options.config]        — config POJO or config object
 * @param {Function} [options.rootComponent] — root React component
 * @param {string}   [options.selector='#root'] — CSS selector to mount on
 * @param {Function} [options.onReady]       — async (appCtx) => void — called after CDI starts,
 *                                             before render — use to set up providers etc.
 * @returns {Promise<{ applicationContext, CdiProvider, useCdi, useBean, getBean }>}
 */
export async function reactStarter(options) {
  const {
    React,
    createRoot,
    contexts,
    rootComponent: RootComponent,
    onReady,
    selector = '#root',
  } = options;

  if (!React)      throw new Error('reactStarter: options.React is required.');
  if (!createRoot) throw new Error('reactStarter: options.createRoot is required.');
  if (!contexts)   throw new Error('reactStarter: options.contexts is required.');

  // Boot.boot() handles POJO → config resolution, profile URL mapping,
  // logger setup, banner, and CDI wiring — exactly as in server-side examples.
  const appCtx = await Boot.boot({ config: options.config, contexts, run: false });

  if (onReady) await onReady(appCtx);

  // Build React Context + hooks
  const CdiContext = React.createContext(null);

  function CdiProvider({ children }) {
    return React.createElement(CdiContext.Provider, { value: appCtx }, children);
  }

  function useCdi() {
    const ctx = React.useContext(CdiContext);
    if (!ctx) throw new Error('useCdi must be used within a <CdiProvider>');
    return ctx;
  }

  function useBean(name) {
    return useCdi().get(name);
  }

  function getBean(name) {
    return appCtx.get(name);
  }

  // Mount if a root component and selector are provided
  if (RootComponent && selector) {
    const el = typeof document !== 'undefined' && document.querySelector(selector);
    if (el) {
      const root = createRoot(el);
      root.render(
        React.createElement(CdiProvider, null,
          React.createElement(RootComponent, { useCdi, useBean, getBean }),
        ),
      );
    }
  }

  return { applicationContext: appCtx, CdiProvider, useCdi, useBean, getBean };
}

/**
 * Boot CDI and create React integration utilities.
 *
 * Unlike reactStarter(), this does NOT call Boot.boot() — it starts
 * ApplicationContext directly. Useful when you want manual control over
 * config wrapping or are integrating into an existing boot sequence.
 *
 * For full Boot.boot() behaviour (profile URL resolution, banner, logger
 * setup), use reactStarter() instead.
 *
 * @param {object} options
 * @param {Array}  options.contexts — CDI Context instances
 * @param {object} options.config  — config object
 * @param {object} [options.React] — React module (default: tries window.React)
 * @returns {Promise<{ applicationContext, CdiProvider, useCdi, useBean, getBean }>}
 */
export async function bootCdi(options) {
  const { contexts, config } = options;
  const React = options.React
    || (typeof window !== 'undefined' && window.React);

  const appCtx = new ApplicationContext({ contexts, config });
  await appCtx.start({ run: false });

  if (!React || !React.createContext) {
    return {
      applicationContext: appCtx,
      CdiProvider: null,
      useCdi: null,
      useBean: null,
      getBean: (name) => appCtx.get(name),
    };
  }

  const CdiContext = React.createContext(null);

  function CdiProvider({ children }) {
    return React.createElement(CdiContext.Provider, { value: appCtx }, children);
  }

  function useCdi() {
    const ctx = React.useContext(CdiContext);
    if (!ctx) throw new Error('useCdi must be used within a <CdiProvider>');
    return ctx;
  }

  function useBean(name) {
    return useCdi().get(name);
  }

  function getBean(name) {
    return appCtx.get(name);
  }

  return { applicationContext: appCtx, CdiProvider, useCdi, useBean, getBean };
}

/**
 * Boot CDI without React — pure headless mode for testing.
 *
 * @param {object} options
 * @param {Array}  options.contexts
 * @param {object} options.config
 * @returns {Promise<ApplicationContext>}
 */
export async function bootCdiHeadless(options) {
  const { contexts, config } = options;
  const appCtx = new ApplicationContext({ contexts, config });
  await appCtx.start({ run: false });
  return appCtx;
}
