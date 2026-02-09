import { getBookmarks, getDomains, getTags } from '../actions/bookmark-actions';
import { parseSearchParams, buildFiltersFromParams, buildSortFromParams } from '@/lib/search-params-schema';
import { SearchForm } from '@/components/search-form';
import { BookmarkList } from '@/components/bookmark-list';
import { BookmarkBulkActionsBar } from '@/components/bookmark-bulk-actions-bar';
import { PageLayout } from '@/components/page-layout';
import { PageActionLink } from '@/components/page-action-link';
import { SearchPageClient } from '@/components/search-page-client';
import { Suspense } from 'react';
import Link from 'next/link';
import { BarChart3, Sparkles } from 'lucide-react';
import { SyncNowButton } from '@/components/sync-now-button';
import { Skeleton } from '@/components/ui/skeleton';
import type { SearchFormValues } from '@/lib/search-params-schema';

// This page uses server-side database queries, so it should not be statically generated
export const dynamic = 'force-dynamic';

type RawSearchParams = { [key: string]: string | string[] | undefined };
type ParsedSearchParams = ReturnType<typeof parseSearchParams>;
type Sort = ReturnType<typeof buildSortFromParams>;
type BookmarksData = Awaited<ReturnType<typeof getBookmarks>>;

function SearchFormFallback() {
  return (
    <div className="flex flex-1 items-center gap-2 flex-wrap">
      <Skeleton className="h-8 w-[150px] lg:w-[250px]" />
      <Skeleton className="h-8 w-[130px]" />
      <Skeleton className="h-8 w-[110px]" />
      <Skeleton className="h-8 w-[90px]" />
    </div>
  );
}

function BookmarkListFallback() {
  return (
    <div className="rounded-md border">
      <div className="flex items-center justify-center h-24">
        <div className="text-sm text-muted-foreground">Loading bookmarks...</div>
      </div>
    </div>
  );
}

async function SearchFormSection({
  domainsPromise,
  tagsPromise,
  initialValues,
}: {
  domainsPromise: Promise<string[]>;
  tagsPromise: Promise<Array<{ id: string; label: string }>>;
  initialValues: SearchFormValues;
}) {
  const [domains, tags] = await Promise.all([domainsPromise, tagsPromise]);

  return (
    <SearchForm
      domains={domains}
      tags={tags}
      initialValues={initialValues}
    />
  );
}

async function SearchResultsSection({
  bookmarksPromise,
  sort,
  params,
  rawParams,
}: {
  bookmarksPromise: Promise<BookmarksData>;
  sort: Sort;
  params: ParsedSearchParams;
  rawParams: RawSearchParams;
}) {
  const bookmarksData = await bookmarksPromise;

  return (
    <div className="flex flex-col gap-3">
      <BookmarkBulkActionsBar
        bookmarks={bookmarksData.bookmarks.map(({ id, url }) => ({ id, url }))}
      />
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
    </div>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>
}) {
  // Await and parse search params
  const rawParams = await searchParams;
  const params = parseSearchParams(rawParams);
  
  // Build filters and sort from parsed params
  const filters = buildFiltersFromParams(params);
  const sort = buildSortFromParams(params);

  // Start all data fetches in parallel and stream each section with Suspense
  const bookmarksPromise = getBookmarks(filters, sort, 25, params.cursor);
  const domainsPromise = getDomains();
  const tagsPromise = getTags();
  
  // Convert params to form values
  const formValues: SearchFormValues = {
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
          <div className="flex items-center gap-2 flex-wrap">
            <PageActionLink href="/ai/ask">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">AI</span>
            </PageActionLink>
            <PageActionLink href="/stats">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Stats</span>
            </PageActionLink>
            <SyncNowButton />
          </div>
        }
      >
        <div className="flex items-center justify-between">
          <Suspense fallback={<SearchFormFallback />}>
            <SearchFormSection
              domainsPromise={domainsPromise}
              tagsPromise={tagsPromise}
              initialValues={formValues}
            />
          </Suspense>
        </div>

        <Suspense fallback={<BookmarkListFallback />}>
          <SearchResultsSection
            bookmarksPromise={bookmarksPromise}
            sort={sort}
            params={params}
            rawParams={rawParams}
          />
        </Suspense>
      </PageLayout>
    </SearchPageClient>
  );
}
