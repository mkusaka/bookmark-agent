'use client';

import { ReactNode } from 'react';
import { NavigationProvider } from '@/contexts/navigation-context';

interface SearchPageClientProps {
  children: ReactNode;
}

export function SearchPageClient({ children }: SearchPageClientProps) {
  return (
    <NavigationProvider>
      {children}
    </NavigationProvider>
  );
}