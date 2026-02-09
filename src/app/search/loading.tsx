import Link from 'next/link';
import { BarChart3, Sparkles } from 'lucide-react';
import { PageLayout } from '@/components/page-layout';
import { PageActionLink } from '@/components/page-action-link';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <PageLayout
      title={
        <Link href="/search" className="hover:underline">
          Bookmark Search
        </Link>
      }
      description="Search and manage bookmarks with advanced filtering"
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          <PageActionLink href="/ai/ask">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">AI</span>
          </PageActionLink>
          <PageActionLink href="/stats">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Stats</span>
          </PageActionLink>
        </div>
      }
    >
      <div className="flex flex-1 items-center gap-2 flex-wrap">
        <Skeleton className="h-8 w-[150px] lg:w-[250px]" />
        <Skeleton className="h-8 w-[130px]" />
        <Skeleton className="h-8 w-[110px]" />
        <Skeleton className="h-8 w-[90px]" />
      </div>

      <div className="rounded-md border">
        <div className="flex items-center justify-center h-24">
          <div className="text-sm text-muted-foreground">Loading bookmarks...</div>
        </div>
      </div>
    </PageLayout>
  );
}
