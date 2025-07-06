'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReactNode } from 'react';

interface StatsTabsProps {
  children: ReactNode;
}

const validTabs = ['overview', 'timeline', 'domains', 'tags'] as const;
type TabValue = typeof validTabs[number];

export function StatsTabs({ children }: StatsTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentTab = searchParams.get('tab') || 'overview';
  const activeTab = validTabs.includes(currentTab as TabValue) ? currentTab : 'overview';
  
  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'overview') {
      params.delete('tab');
    } else {
      params.set('tab', value);
    }
    const queryString = params.toString();
    router.push(queryString ? `/stats?${queryString}` : '/stats');
  };
  
  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
        <TabsTrigger value="domains">Domains</TabsTrigger>
        <TabsTrigger value="tags">Tags</TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  );
}