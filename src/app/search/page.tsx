import { getBookmarks, getDomains, getTags } from '../actions/bookmark-actions';
import { parseSearchParams, buildFiltersFromParams, buildSortFromParams } from '@/lib/search-params-schema';
import { SearchForm } from '@/components/search-form';
import { BookmarkList } from '@/components/bookmark-list';
import { ThemeToggle } from '@/components/theme-toggle';
import { SearchPageClient } from '@/components/search-page-client';
import { Suspense } from 'react';

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
  
  // Fetch all data in parallel
  const [bookmarksData, domains, tags] = await Promise.all([
    getBookmarks(filters, sort, 25, params.cursor),
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
      <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 w-full">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-semibold tracking-tight">Bookmark Search</h2>
            <p className="text-muted-foreground">
              Search and manage bookmarks with advanced filtering
            </p>
          </div>
          <ThemeToggle />
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <SearchForm
              domains={domains}
              tags={tags}
              initialValues={formValues}
            />
          </div>

          <Suspense fallback={
            <div className="rounded-md border">
              <div className="flex items-center justify-center h-24">
                <div className="text-sm text-muted-foreground">Loading...</div>
              </div>
            </div>
          }>
            <BookmarkList
              bookmarks={bookmarksData.bookmarks}
              total={bookmarksData.total}
              hasNextPage={bookmarksData.pagination.hasNextPage}
              hasPreviousPage={bookmarksData.pagination.hasPreviousPage}
              currentSort={sort}
              currentFilters={{
                domains: params.domains,
                tags: params.tags,
              }}
              currentParams={rawParams}
            />
          </Suspense>
        </div>
      </div>
    </SearchPageClient>
  );
}