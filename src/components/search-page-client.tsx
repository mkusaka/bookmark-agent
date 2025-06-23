'use client';

import { ReactNode } from 'react';
import { NavigationProvider } from '@/contexts/navigation-context';
import { FocusRefresher } from '@/components/focus-refresher';

interface SearchPageClientProps {
  children: ReactNode;
}

export function SearchPageClient({ children }: SearchPageClientProps) {
  return (
    <NavigationProvider>
      <FocusRefresher />
      {children}
    </NavigationProvider>
  );
}