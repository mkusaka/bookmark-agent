import { Suspense } from 'react';
import Link from 'next/link';
import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';
import { OverviewTab } from '@/components/stats/overview-tab';
import { TimelineTabWrapper } from '@/components/stats/timeline-tab-wrapper';
import { DomainsTab } from '@/components/stats/domains-tab';
import { TagsTab } from '@/components/stats/tags-tab';
import { UsersTab } from '@/components/stats/users-tab';
import { StatsTabsWrapper } from '@/components/stats/stats-tabs-wrapper';
import { ThemeToggle } from '@/components/theme-toggle';

function TabSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-[100px] w-full" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}

export default function StatsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-3xl font-bold">Bookmark Statistics</h1>
        <div className="flex items-center gap-2">
          <Link href="/search">
            <Button variant="outline" size="sm">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </Link>
          <ThemeToggle />
        </div>
      </div>
      
      <StatsTabsWrapper>
        <TabsContent value="overview">
          <Suspense fallback={<TabSkeleton />}>
            <OverviewTab />
          </Suspense>
        </TabsContent>
        
        <TabsContent value="timeline">
          <Suspense fallback={<TabSkeleton />}>
            <TimelineTabWrapper />
          </Suspense>
        </TabsContent>
        
        <TabsContent value="domains">
          <Suspense fallback={<TabSkeleton />}>
            <DomainsTab />
          </Suspense>
        </TabsContent>
        
        <TabsContent value="tags">
          <Suspense fallback={<TabSkeleton />}>
            <TagsTab />
          </Suspense>
        </TabsContent>
        
        <TabsContent value="users">
          <Suspense fallback={<TabSkeleton />}>
            <UsersTab />
          </Suspense>
        </TabsContent>
      </StatsTabsWrapper>
    </div>
  );
}