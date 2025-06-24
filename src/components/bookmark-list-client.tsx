'use client';

import { ReactNode } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';

interface BookmarkListClientProps {
  children: ReactNode;
}

export function BookmarkListClient({ children }: BookmarkListClientProps) {
  return (
    <TooltipProvider>
      {children}
    </TooltipProvider>
  );
}