import { Suspense } from 'react';
import { StatsTabs } from './stats-tabs';
import { ReactNode } from 'react';

interface StatsTabsWrapperProps {
  children: ReactNode;
}

export function StatsTabsWrapper({ children }: StatsTabsWrapperProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StatsTabs>{children}</StatsTabs>
    </Suspense>
  );
}