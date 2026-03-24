/**
 * cdi-context.js — module-level CDI context singleton
 *
 * main.jsx calls init() after reactStarter() returns, storing the useCdi
 * and useBean hooks so App.jsx and any other component can import them
 * without prop-drilling.
 *
 * This is the standard pattern for module-scoped React context:
 * the context object and hooks are created once and exported as singletons.
 */
import React from 'react';

// Internal React context — shared between CdiProvider and hooks
export const CdiContext = React.createContext(null);

/**
 * Hook: get the full ApplicationContext.
 * Must be called inside a component rendered beneath <CdiProvider>.
 */
export function useCdi() {
  const ctx = React.useContext(CdiContext);
  if (!ctx) throw new Error('useCdi must be used within a <CdiProvider>');
  return ctx;
}

/**
 * Hook: get a specific CDI bean by name.
 */
export function useBean(name) {
  return useCdi().get(name);
}

/**
 * CdiProvider — wraps the component tree with the CDI ApplicationContext.
 * main.jsx renders <CdiProvider appCtx={appCtx}><App /></CdiProvider>.
 */
export function CdiProvider({ appCtx, children }) {
  return React.createElement(CdiContext.Provider, { value: appCtx }, children);
}
