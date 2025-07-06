import { parseSearchParams, buildFiltersFromParams, buildSortFromParams } from '@/lib/search-params-schema';
import { SearchFormWrapper } from '@/components/search-form-wrapper';
import { BookmarkListWrapper } from '@/components/bookmark-list-wrapper';
import { BookmarkBulkActionsWrapper } from '@/components/bookmark-bulk-actions-wrapper';
import { PageLayout } from '@/components/page-layout';
import { SearchPageClient } from '@/components/search-page-client';
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
  // Await and parse search params
  const rawParams = await searchParams;
  const params = parseSearchParams(rawParams);
  
  // Build filters and sort from parsed params
  const filters = buildFiltersFromParams(params);
  const sort = buildSortFromParams(params);
  
  // Convert params to form values
  const formValues = {
    q: params.q || '',
    domains: params.domains,
    tags: params.tags,
    users: params.users,
    from: params.from,
    to: params.to,
    sortBy: params.sortBy,
    order: params.order,
    cursor: params.cursor,
  };

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
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Suspense fallback={
            <div className="flex flex-1 items-center gap-2 flex-wrap">
              <Skeleton className="h-8 w-[150px] lg:w-[250px]" />
              <Skeleton className="h-8 w-[100px]" />
              <Skeleton className="h-8 w-[100px]" />
              <Skeleton className="h-8 w-[100px]" />
            </div>
          }>
            <SearchFormWrapper
              initialValues={formValues}
            />
          </Suspense>
          
          <Suspense fallback={null}>
            <BookmarkBulkActionsWrapper
              filters={filters}
              sort={sort}
              cursor={params.cursor}
            />
          </Suspense>
        </div>

        <Suspense fallback={
          <div className="rounded-md border">
            <div className="flex items-center justify-center h-24">
              <div className="text-sm text-muted-foreground">Loading bookmarks...</div>
            </div>
          </div>
        }>
          <BookmarkListWrapper
            filters={filters}
            sort={sort}
            cursor={params.cursor}
            currentFilters={{
              domains: params.domains,
              tags: params.tags,
            }}
            currentParams={rawParams}
          />
        </Suspense>
      </PageLayout>
    </SearchPageClient>
  );
}
