import { getBookmarks, getDomains, getTags, getUsers } from '../actions/bookmark-actions';
import { BookmarkSearchWrapper } from './bookmark-search-wrapper';
import { parseSearchParams, buildFiltersFromParams, buildSortFromParams } from '@/lib/search-params-schema';

export default async function BookmarksPage({
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
  const [bookmarksData, domains, tags, users] = await Promise.all([
    getBookmarks(filters, sort, 25, params.cursor),
    getDomains(),
    getTags(),
    getUsers(),
  ]);
  
  return (
    <BookmarkSearchWrapper
      initialBookmarks={bookmarksData.bookmarks}
      domains={domains}
      tags={tags}
      users={users}
      total={bookmarksData.total}
      initialHasNextPage={bookmarksData.pagination.hasNextPage}
      initialHasPreviousPage={bookmarksData.pagination.hasPreviousPage}
      initialFilters={filters}
      initialSort={sort}
      initialCursor={params.cursor}
    />
  );
}