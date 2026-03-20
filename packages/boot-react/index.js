/**
 * @alt-javascript/boot-react — React integration for CDI.
 *
 * Provides utilities to bridge CDI ApplicationContext into React
 * applications via React Context API. Works with both class
 * components and hooks.
 *
 * Usage with hooks (recommended):
 *   // boot.js — app entry point
 *   import { bootCdi } from '@alt-javascript/boot-react';
 *   export const { CdiProvider, useCdi, useBean } = await bootCdi({ contexts, config });
 *
 *   // App.jsx
 *   function App() {
 *     return <CdiProvider><TodoList /></CdiProvider>;
 *   }
 *
 *   // TodoList.jsx
 *   function TodoList() {
 *     const todoService = useBean('todoService');
 *     const [todos, setTodos] = useState(todoService.list());
 *     ...
 *   }
 *
 * Usage without React (headless / testing):
 *   import { bootCdiHeadless } from '@alt-javascript/boot-react';
 *   const ctx = await bootCdiHeadless({ contexts, config });
 *   const svc = ctx.get('todoService');
 *
 * Note: This package does NOT depend on React at runtime. It provides
 * factory functions that create React-bound utilities when React is
 * available. This keeps it testable without a React DOM environment.
 */
import { ApplicationContext } from '@alt-javascript/cdi';

/**
 * Boot CDI and create React integration utilities.
 *
 * Returns functions that use React.createContext and React.createElement
 * to provide CDI beans to the component tree. Requires React to be
 * passed explicitly or available globally.
 *
 * @param {object} options
 * @param {Array} options.contexts — CDI Context instances
 * @param {object} options.config — config object
 * @param {object} [options.React] — React module (default: tries global)
 * @returns {Promise<{ applicationContext, CdiProvider, useCdi, useBean, getBean }>}
 */
export async function bootCdi(options) {
  const { contexts, config } = options;
  const React = options.React
    || (typeof window !== 'undefined' && window.React);

  // Boot CDI
  const appCtx = new ApplicationContext({ contexts, config });
  await appCtx.start({ run: false });

  if (!React || !React.createContext) {
    // Return headless result — no React available
    return {
      applicationContext: appCtx,
      CdiProvider: null,
      useCdi: null,
      useBean: null,
      getBean: (name) => appCtx.get(name),
    };
  }

  // Create React Context
  const CdiContext = React.createContext(null);

  // Provider component
  function CdiProvider({ children }) {
    return React.createElement(CdiContext.Provider, { value: appCtx }, children);
  }

  // Hook: get the full ApplicationContext
  function useCdi() {
    const ctx = React.useContext(CdiContext);
    if (!ctx) {
      throw new Error('useCdi must be used within a <CdiProvider>');
    }
    return ctx;
  }

  // Hook: get a specific bean by name
  function useBean(name) {
    const ctx = useCdi();
    return ctx.get(name);
  }

  // Utility: get a bean without hooks (for non-component code)
  function getBean(name) {
    return appCtx.get(name);
  }

  return { applicationContext: appCtx, CdiProvider, useCdi, useBean, getBean };
}

/**
 * Boot CDI without React — pure headless mode for testing.
 *
 * @param {object} options
 * @param {Array} options.contexts
 * @param {object} options.config
 * @returns {Promise<ApplicationContext>}
 */
export async function bootCdiHeadless(options) {
  const { contexts, config } = options;
  const appCtx = new ApplicationContext({ contexts, config });
  await appCtx.start({ run: false });
  return appCtx;
}
