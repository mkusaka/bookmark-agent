import { PageLayout } from '@/components/page-layout';
import { SearchPageClient } from '@/components/search-page-client';
import { SearchPageContent } from '@/components/search-page-content';
import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BarChart3 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // Don't await here - let Suspense handle it
  const rawParams = await searchParams;

  return (
    <SearchPageClient>
      <PageLayout
        title={
          <Link href="/search" className="hover:underline">
            Bookmark Search
          </Link>
        }
        description="Search and manage bookmarks with advanced filtering"
        actions={
          <Link href="/stats">
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Stats
            </Button>
          </Link>
        }
      >
        <Suspense fallback={
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-1 items-center gap-2 flex-wrap">
                <Skeleton className="h-8 w-[150px] lg:w-[250px]" />
                <Skeleton className="h-8 w-[100px]" />
                <Skeleton className="h-8 w-[100px]" />
                <Skeleton className="h-8 w-[100px]" />
              </div>
            </div>
            <div className="h-8" />
            <div className="rounded-md border">
              <div className="flex items-center justify-center h-24">
                <div className="text-sm text-muted-foreground">Loading...</div>
              </div>
            </div>
          </div>
        }>
          <SearchPageContent searchParams={rawParams} />
        </Suspense>
      </PageLayout>
    </SearchPageClient>
  );
}
