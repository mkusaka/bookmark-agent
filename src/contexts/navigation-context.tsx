'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface NavigationContextType {
  isPending: boolean;
  setIsPending: (pending: boolean) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [isPending, setIsPending] = useState(false);

  return (
    <NavigationContext.Provider value={{ isPending, setIsPending }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigationPending() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigationPending must be used within NavigationProvider');
  }
  return context;
}