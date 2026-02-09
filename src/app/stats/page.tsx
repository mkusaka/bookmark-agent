import { Suspense } from 'react';
import Link from 'next/link';
import { TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Sparkles } from 'lucide-react';
import { OverviewTab } from '@/components/stats/overview-tab';
import { TimelineTabWrapper } from '@/components/stats/timeline-tab-wrapper';
import { DomainsTab } from '@/components/stats/domains-tab';
import { TagsTab } from '@/components/stats/tags-tab';
import { StatsTabsWrapper } from '@/components/stats/stats-tabs-wrapper';
import { PageLayout } from '@/components/page-layout';
import { PageActionLink } from '@/components/page-action-link';

// This page uses server-side database queries, so it should not be statically generated
export const dynamic = 'force-dynamic';

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
    <PageLayout
      title={
        <Link href="/stats" className="hover:underline">
          Bookmark Statistics
        </Link>
      }
      description="Analyze your bookmarking patterns and trends"
      actions={
        <>
          <PageActionLink href="/ai" label="AI" icon={Sparkles} />
          <PageActionLink href="/search" label="Search" icon={Search} />
        </>
      }
    >
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
        
      </StatsTabsWrapper>
    </PageLayout>
  );
}
