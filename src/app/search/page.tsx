import { getDomains, getTags } from '../actions/bookmark-actions';
import { parseSearchParams, buildFiltersFromParams, buildSortFromParams } from '@/lib/search-params-schema';
import { SearchForm } from '@/components/search-form';
import { BookmarkListSection } from '@/components/bookmark-list-section';
import { PageLayout } from '@/components/page-layout';
import { SearchPageClient } from '@/components/search-page-client';
import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BarChart3 } from 'lucide-react';

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
  
  // Fetch domains and tags (these are fast)
  const [domains, tags] = await Promise.all([
    getDomains(),
    getTags(),
  ]);
  
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
        <div className="flex items-center justify-between">
          <SearchForm
            domains={domains}
            tags={tags}
            initialValues={formValues}
          />
        </div>

        <Suspense fallback={
          <div className="space-y-4">
            <div className="h-8" />
            <div className="rounded-md border">
              <div className="flex items-center justify-center h-24">
                <div className="text-sm text-muted-foreground">Loading bookmarks...</div>
              </div>
            </div>
          </div>
        }>
          <BookmarkListSection
            filters={filters}
            sort={sort}
            cursor={params.cursor}
            currentParams={rawParams}
          />
        </Suspense>
      </PageLayout>
    </SearchPageClient>
  );
}
